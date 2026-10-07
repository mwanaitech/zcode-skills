'use strict';
// Verificateur d'invariants des skills, sans dependance externe.
//
//   node tools/verify-skills.js [racine du depot]
//
// Contredit les regressions introduites par la deduplication des doublons :
//   - un SKILL.md manquant ou vide,
//   - un dossier de skill de premier niveau sans SKILL.md,
//   - deux skills de meme nom normalise parmi les skills de premier niveau
//     (le chargeur n'ecrase que ce niveau : un doublon ici est un vrai conflit),
//   - des repertoires vides,
//   - une perte de volume (le nombre de SKILL.md ne peut pas s'effondrer).
//
// Les invariants ne bloquent pas sur ces defaults : ils verifient que le
// nombre de SKILL.md ne chute pas et qu'aucun doublon n'apparait. Le detail
// des anomalies est affiche pour permettre un suivi, sans faire echouer la CI
// sur des defauts herites.
//
// Reference : le chargeur de Freebuff ne lit que ~/.claude/skills,
// ~/.agents/skills, <cwd>/.claude/skills et <cwd>/.agents/skills, sur un seul
// niveau. skills/ et agent-skills/ sont donc des sources, jamais chargees.

const fs = require('fs');
const path = require('path');

const repo = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ROOTS = ['skills', 'agent-skills'];
const SKILL_MD = 1762; // valeur de reference sur origin/main
const SEUIL_ALERTE = 0.9; // en dessous, la CI echoue

const readSkillMd = (dir) => {
  for (const f of ['SKILL.md', 'skill.md']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  return null;
};

// Frontmatter YAML minimal : seules les cles de premiere ligne nous interessent.
const parseFrontmatter = (md) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (k) out[k[1]] = k[2].trim();
  }
  return out;
};

const normalize = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const dirs = []; // tous les dossiers, avec leur profondeur
const skillDirs = []; // dossiers portant un SKILL.md

const walk = (dir, rel, depth) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  if (entries.length === 0) anomalies.repertoiresVides.push(rel || '.');
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    dirs.push({ full, rel: r, depth });
    const md = readSkillMd(full);
    if (md !== null) skillDirs.push({ full, rel: r, depth, md });
    walk(full, r, depth + 1);
  }
};

const anomalies = {
  repertoiresVides: [],
  skillMdVide: [],
  niveau1SansSkillMd: [],
  doublonsNiveau1: [],
  sansFrontmatter: [],
  sansName: [],
  sansDescription: [],
  nomDifferentDuDossier: [],
  slugInvalide: [],
};

for (const root of ROOTS) {
  const base = path.join(repo, root);
  if (!fs.existsSync(base)) {
    console.error(`ERREUR : ${root}/ introuvable sous ${repo}`);
    process.exit(2);
  }
  walk(base, root, 1);
}

const parNomNiveau1 = new Map();
for (const s of skillDirs) {
  if (s.depth !== 1) continue;
  const base = path.basename(s.rel);
  const slugOk = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(base);
  if (!slugOk) anomalies.slugInvalide.push(s.rel);

  const fm = parseFrontmatter(s.md);
  if (!fm) {
    anomalies.sansFrontmatter.push(s.rel);
    continue;
  }
  if (!fm.name) anomalies.sansName.push(s.rel);
  else if (fm.name !== base) anomalies.nomDifferentDuDossier.push(`${s.rel} (name: ${fm.name})`);
  if (!fm.description) anomalies.sansDescription.push(s.rel);

  const key = normalize(fm.name || base);
  if (!parNomNiveau1.has(key)) parNomNiveau1.set(key, []);
  parNomNiveau1.get(key).push(s.rel);
}
anomalies.doublonsNiveau1 = [...parNomNiveau1.values()].filter((v) => v.length > 1);

// Dossier de premier niveau sans SKILL.md : conteneur de categorie tolerated
// (skills/design/, skills/mlops/...), signale mais non bloquant.
const niveau1AvecMd = new Set(skillDirs.filter((s) => s.depth === 1).map((s) => s.rel));
for (const d of dirs) {
  if (d.depth === 1 && !niveau1AvecMd.has(d.rel)) anomalies.niveau1SansSkillMd.push(d.rel);
}
for (const s of skillDirs) if (!s.md.trim()) anomalies.skillMdVide.push(s.rel);

const nbSkillMd = skillDirs.length;
const volumeSuffisant = nbSkillMd >= Math.floor(SKILL_MD * SEUIL_ALERTE);

const bloquants = [
  { nom: 'doublons de nom parmi les skills de premier niveau', liste: anomalies.doublonsNiveau1 },
  { nom: 'SKILL.md vide', liste: anomalies.skillMdVide },
  { nom: 'repertoires vides', liste: anomalies.repertoiresVides },
];
const informatifs = [
  { nom: 'SKILL.md sans frontmatter YAML', liste: anomalies.sansFrontmatter },
  { nom: 'SKILL.md sans name', liste: anomalies.sansName },
  { nom: 'SKILL.md sans description', liste: anomalies.sansDescription },
  { nom: 'name different du nom de dossier', liste: anomalies.nomDifferentDuDossier },
  { nom: 'nom de dossier hors slug a-z0-9', liste: anomalies.slugInvalide },
  { nom: 'dossiers de premier niveau sans SKILL.md (conteneurs)', liste: anomalies.niveau1SansSkillMd },
];

const echecs = bloquants.filter((b) => b.liste.length > 0);
if (!volumeSuffisant) echecs.push({ nom: `volume insuffisant (${nbSkillMd} < ${Math.floor(SKILL_MD * SEUIL_ALERTE)})`, liste: ['SKILL.md'] });

console.log('Invariants des skills');
console.log(`  racines analysees   : ${ROOTS.join(', ')}`);
console.log(`  dossiers            : ${dirs.length}`);
console.log(`  SKILL.md            : ${nbSkillMd} (reference ${SKILL_MD})`);
console.log(`  skills de niveau 1  : ${niveau1AvecMd.size}`);
console.log('');
console.log('BLOQUANT');
for (const b of bloquants) console.log(`  ${b.liste.length === 0 ? 'OK  ' : 'ECHEC'} ${b.nom} : ${b.liste.length}`);
console.log('INFORMATIF (defauts herites, non bloquants)');
for (const b of informatifs) console.log(`  --   ${b.nom} : ${b.liste.length}`);

for (const b of [...bloquants, ...informatifs]) {
  if (b.liste.length) console.log(`\n[${b.nom}]\n  ` + b.liste.slice(0, 10).join('\n  ') + (b.liste.length > 10 ? `\n  ... +${b.liste.length - 10}` : ''));
}

if (echecs.length) {
  console.log('\nECHEC');
  for (const e of echecs) console.log(`  - ${e.nom} (${e.liste.length})`);
  process.exit(1);
}
console.log('\nOK : invariants respectes');