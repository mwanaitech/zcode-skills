#!/usr/bin/env python3
"""
Bedrock Model Availability Diagnostic
Run to check which Bedrock models are actually usable vs just listed.
Detects: gated models, quota exhaustion, invalid model IDs.
"""
import boto3, json, os

def diagnose():
    session = boto3.Session(region_name='us-east-1')
    client = session.client('bedrock')
    runtime = session.client('bedrock-runtime')

    # Models to test: (friendly_name, model_id)
    to_test = [
        ('Sonnet 4', 'global.anthropic.claude-sonnet-4-20250514-v1:0'),
        ('Sonnet 4-6', 'global.anthropic.claude-sonnet-4-6'),
        ('Sonnet 5', 'global.anthropic.claude-sonnet-5'),
        ('Fable 5', 'global.anthropic.claude-fable-5'),
        ('Opus 4-6', 'global.anthropic.claude-opus-4-6'),
        ('Haiku 3', 'anthropic.claude-3-haiku-20240307-v1:0'),
    ]

    print("=== Bedrock Model Diagnostic ===\n")
    print(f"{'Model':<25} {'Avail Status':<20} {'Auth':<12} {'Ent':<10} {'Invoke':<20}")
    print("-" * 95)

    for name, model_id in to_test:
        base_id = model_id.replace('global.', '')
        if base_id.startswith('us.'):
            base_id = base_id.replace('us.', '')

        # Check availability
        try:
            av = client.get_foundation_model_availability(modelId=base_id)
            avail = av['agreementAvailability']['status']
            auth = av['authorizationStatus']
            ent = av['entitlementAvailability']
        except Exception as e:
            avail = 'ERROR'
            auth = 'N/A'
            ent = 'N/A'

        # Try invoke
        try:
            resp = runtime.converse(
                modelId=model_id,
                messages=[{'role': 'user', 'content': [{'text': 'Hi'}]}],
                inferenceConfig={'maxTokens': 5}
            )
            invoke = 'OK'
        except Exception as e:
            msg = str(e)
            if 'not available' in msg:
                invoke = 'GATED'
            elif 'Too many tokens' in msg:
                invoke = 'QUOTA'
            elif 'Invalid' in msg:
                invoke = 'INVALID'
            else:
                invoke = 'ERROR'

        print(f"{name:<25} {avail:<20} {auth:<12} {ent:<10} {invoke:<20}")

        # Detailed gate warning
        if avail == 'AVAILABLE' and invoke in ('GATED', 'NOT_AVAILABLE'):
            print(f"  WARNING: EULA accepted but model is gated by provider. Contact AWS Support.")

    print("\n=== Legend ===")
    print("Avail Status: AVAILABLE = EULA accepted, NOT_AVAILABLE = needs EULA")
    print("Auth: AUTHORIZED = can call, UNAUTHORIZED = needs IAM permissions")
    print("Ent: AVAILABLE = model enabled in region, UNAVAILABLE = region/scale restriction")
    print("Invoke: OK=works, GATED=blocked by provider, QUOTA=daily limit hit, INVALID=wrong model ID")

if __name__ == '__main__':
    diagnose()
