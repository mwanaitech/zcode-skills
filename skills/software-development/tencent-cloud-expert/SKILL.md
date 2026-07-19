---
title: Tencent Cloud Expert
name: tencent-cloud-expert
description: 'Package expert Tencent Cloud — routage par scène parmi 10 modules de compétences : infra, Lighthouse, DNSPod, CloudBase, Web, MiniProgram, COS, stockage, OCR, ASR.'
version: 1.0.0
source: skillhub
author: custom
tags:
  - tencent-cloud
  - tencent
  - cloud
  - devops
  - cloudbase
  - lighthouse
  - cos
  - ocr
  - asr
  - dnspod
metadata:
  hermes:
    triggers:
      - tencent
      - tencent cloud
      - cloud tencent
      - tx cloud
      - tc cloud
      - cloudbase
      - cloud base
      - tcb
      - 云开发
      - lighthouse
      - phare
      - serveur léger
      - light server
      - dnspod
      - dns pod
      - nom de domaine
      - domain name
      - résolution dns
      - dns resolution
      - enregistrement a
      - enregistrement cname
      - a record
      - cname record
      - cos
      - bucket
      - objet storage
      - object storage
      - stockage cloud
      - cloud storage
      - ocr
      - reconnaissance texte
      - text recognition
      - image texte
      - asr
      - reconnaissance vocale
      - speech recognition
      - transcription audio
      - audio to text
      - sous-titres
      - subtitles
      - infra cloud
      - cloud infra
      - inspection cloud
      - cloud inspection
      - cvm
      - certificat ssl
      - ssl certificate
      - monitoring cloud
      - cloud monitoring
      - wechat miniprogram
      - mini programme
      - applet wechat
      - 小程序
      - wechat cloud
      - hébergement cloud
      - cloud hosting
      - cloud function
      - fonction cloud
      - 云函数
      - serverless tencent
      - tencent serverless
      - deploiement cloud
      - cloud deployment
      - ai tencent
      - tencent ai
      - hunyuan
      -混元
    tags:
      - tencent-cloud
      - devops
      - cloud-infrastructure
      - cloudbase
      - lighthouse
      - dnspod
      - cos
      - ocr
      - asr
      - wechat
      - miniprogram
      - cloud-storage
      - serverless
---

# Tencent Cloud Expert — Senior Development Engineer

## Quand utiliser ce skill

Active ce workflow quand l'utilisateur demande de :
- gérer/inspecter des **ressources Tencent Cloud** (serveurs, certificats, autorisations, monitoring)
- déployer sur **Lighthouse / CloudBase / COS**
- résoudre des problèmes de **nom de domaine DNSPod**
- développer des **applications Web / MiniProgram WeChat**
- faire de l'**OCR** (reconnaissance de texte dans les images)
- faire de l'**ASR** (transcription audio → texte)
- gérer du **stockage cloud** (COS / file delivery)
- déployer des **projets CloudBase** (Web, applet, fonctions cloud, hébergement)
- dépanner des accès, certificats, résolutions DNS

## Principes d'utilisation

1. **Déterminer d'abord** les objectifs business, les points d'étranglement et les livrables attendus
2. **Pour les actions destructrices** (suppression, écrasement, modification, paiement) → vérifier le statu quo et demander confirmation
3. **Prioriser les résultats** vers l'objectif de l'utilisateur
4. **Quand bloqué** (credentials, permissions, environnement) → expliquer pourquoi et les prochaines étapes

## Dépendances (10 skills SkillHub installés)

| Scène | Skill Slug | Description |
|-------|-----------|-------------|
| Inspection & dépannage | `tencentcloud-infra` | CVM/CBS/COS/VPC/DNSPod/SSL/CAM/Monitor — inventaire, anomalies, certificats |
| Serveur léger | `tencentcloud-lighthouse-skill` | Lighthouse : statut, pare-feu, snapshots, déploiement apps |
| Nom de domaine | `tencentcloud-dnspod-skill` | DNSPod : records A/AAAA/CNAME/MX/TXT, smart resolution, batch |
| CloudBase | `cloudbase` | CloudBase : Web/applet, cloud functions, database, hosting, AI |
| App Web | `web-development` | React/Vue/Vite, debug, build, déploiement CloudBase/Lighthouse |
| MiniProgram | `miniprogram-development` | WeChat Mini Program : pages, components, CI, preview, publish |
| Stockage objet | `tencent-cos-skill` | COS : upload/download/delete, image processing, knowledge base |
| Cloud personnel | `tencent-agent-storage` | Upload/download/backup fichiers cloud, liens partage |
| OCR | `tencentcloud-ocr` | GeneralAccurateOCR : texte dans images, coordonnées, confiance |
| ASR | `tencentcloud-asr` | Reconnaissance vocale : court, extrême, asynchrone, sous-titres |

## Routage par scène

### Scène 1 : Inspection des ressources cloud et dépannage
**Déclencheurs :** inventaire, anomalie, certificat, permission, monitoring, audit
**Skill :** `tencentcloud-infra`
**Livrables :** inventaire ressources, conclusions anomalies, éléments de risque, actions à confirmer

### Scène 2 : Serveur léger et déploiement d'applications
**Déclencheurs :** Lighthouse, phare, serveur léger, déploiement site/app
**Skill :** `tencentcloud-lighthouse-skill`
**Livrables :** état instance, enregistrement déploiement, validation accès, alertes risque

### Scène 3 : Résolution de nom de domaine et réparation d'accès
**Déclencheurs :** DNSPod, domaine, DNS, enregistrement A/CNAME/MX, résolution
**Skill :** `tencentcloud-dnspod-skill`
**Livrables :** enregistrements DNS, validation accès, conclusion réparation

### Scène 4 : CloudBase — mise en ligne et développement
**Déclencheurs :** CloudBase, TCB, 云开发, cloud functions, hosting, API
**Skill :** `cloudbase`
**Livrables :** déploiement/dépannage, URL accès, configuration env

### Scène 5 : Application Web
**Déclencheurs :** Web, site, frontend, React, Vue, page, interface
**Skill :** `web-development`
**Livrables :** implémentation, debug, build, URL accès

### Scène 6 : MiniProgram WeChat
**Déclencheurs :** MiniProgram, WeChat, applet, wx, miniprogram-ci
**Skill :** `miniprogram-development`
**Livrables :** build, preview, upload, instructions CloudBase

### Scène 7 : COS — stockage objet, médias, base de connaissances
**Déclencheurs :** COS, bucket, objet, upload, image processing, CI
**Skill :** `tencent-cos-skill`
**Livrables :** opérations COS, liens signature, résultats traitement fichiers, alertes coût

### Scène 8 : Livraison fichiers et cloud personnel
**Déclencheurs :** upload, backup, cloud drive, téléchargement, partage
**Skill :** `tencent-agent-storage`
**Livrables :** liens téléchargement/aperçu, URL partage, backup

### Scène 9 : OCR — reconnaissance de texte dans les images
**Déclencheurs :** OCR, reconnaissance texte, image → texte, capture, poster
**Skill :** `tencentcloud-ocr`
**Livrables :** texte reconnu, coordonnées zones, confiance

### Scène 10 : ASR — transcription audio
**Déclencheurs :** ASR, transcription, audio → texte, sous-titres, vocal, meeting
**Skill :** `tencentcloud-asr`
**Livrables :** texte transcrit, sous-titres, timestamps, segments

## Règles d'or

1. **Identifier la scène** d'après ce que demande l'utilisateur (ne pas tout exécuter)
2. **Ne pas combiner** les scènes sans lien — le routage est déterministe
3. **Avant action destructive** (delete, overwrite, restart, pay) → toujours confirmer avec l'utilisateur
4. **Coûts** COS, OCR, ASR sont des services payants → prévenir avant d'appeler
5. **Erreurs réelles** — ne pas inventer de résultats quand un appel Cloud échoue
6. **Credentials** — utiliser les clés configurées, expliquer si manquantes
