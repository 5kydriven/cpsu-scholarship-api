#!/usr/bin/env python3
"""
Deterministic State Graph Engine (In-House Micro-LangGraph)

Manages atomic task state transitions, loop counters, and human gate checkpoints
in .agent-work/<TASK_ID>/STATE.json in <1ms on CPU with ZERO LLM tokens.

Usage:
  python .agents/scripts/manage-state.py --action=init --task=feat/oauth-sign-in --complexity=MEDIUM
  python .agents/scripts/manage-state.py --action=transition --task=feat/oauth-sign-in --to=node_1_architect
  python .agents/scripts/manage-state.py --action=set-verdict --task=feat/oauth-sign-in --target=review --verdict=PASS
  python .agents/scripts/manage-state.py --action=status --task=feat/oauth-sign-in
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8')
    except (AttributeError, ValueError):
        pass


def iso_now() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()


def read_state(file_path: str, task_id: str, complexity: str = 'MEDIUM') -> dict:
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, OSError):
            pass
    return {
        'task_id': task_id,
        'workflow_type': 'HOTFIX' if task_id.startswith('hotfix') else 'FEATURE',
        'complexity': complexity,
        'current_node': 'node_0_context_builder',
        'status': 'INITIALIZED',
        'review_cycles': 0,
        'qa_cycles': 0,
        'artifacts': {},
        'gate_checkpoints': {
            'gate_0_scope': 'PENDING',
            'gate_1_architecture': 'PENDING',
            'gate_6_final_verdict': 'PENDING',
        },
        'updated_at': iso_now(),
    }


def write_state(file_path: str, state: dict) -> None:
    state['updated_at'] = iso_now()
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=4)


def main() -> int:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--action')
    parser.add_argument('--task')
    parser.add_argument('--to')
    parser.add_argument('--complexity')
    parser.add_argument('--target')
    parser.add_argument('--verdict')
    parser.add_argument('--status')
    args, _ = parser.parse_known_args()

    action = args.action
    task_id = args.task

    if not action or not task_id:
        sys.stderr.write(
            "❌ Usage: python manage-state.py --action=<init|transition|set-verdict|status> --task=<TASK_ID> [options]\n"
        )
        return 1

    work_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..', '.agent-work'))
    os.makedirs(work_dir, exist_ok=True)

    task_dir = os.path.join(work_dir, task_id)
    os.makedirs(task_dir, exist_ok=True)

    state_file = os.path.join(task_dir, 'STATE.json')

    if action == 'init':
        complexity = args.complexity or 'MEDIUM'
        state = read_state(state_file, task_id, complexity)
        state['complexity'] = complexity
        state['status'] = 'INITIALIZED'
        state['current_node'] = 'node_hotfix_root_cause' if task_id.startswith('hotfix') else 'node_0_context_builder'
        write_state(state_file, state)
        print(f"✅ Task State Graph initialized for [{task_id}] (Complexity: {complexity})")
        print(f"   State File: {state_file}")
        return 0

    elif action == 'transition':
        to_node = args.to
        node_status = args.status or 'RUNNING'
        if not to_node:
            sys.stderr.write("❌ ERROR: Missing --to=<node_name>\n")
            return 1
        state = read_state(state_file, task_id)
        state['current_node'] = to_node
        state['status'] = node_status

        artifact_map = {
            'task_context': os.path.join(task_dir, 'TASK_CONTEXT.md'),
            'task_packet': os.path.join(task_dir, 'TASK_PACKET.md'),
            'architecture_plan': os.path.join(task_dir, 'ARCHITECTURE_PLAN.md'),
            'implementation_plan': os.path.join(task_dir, 'IMPLEMENTATION_PLAN.md'),
            'implementation_report': os.path.join(task_dir, 'IMPLEMENTATION_REPORT.md'),
            'code_review': os.path.join(task_dir, 'CODE_REVIEW.md'),
            'qa_report': os.path.join(task_dir, 'QA_REPORT.md'),
            'release_report': os.path.join(task_dir, 'RELEASE_REPORT.md'),
            'hotfix_context': os.path.join(task_dir, 'HOTFIX_CONTEXT.md'),
            'hotfix_plan': os.path.join(task_dir, 'HOTFIX_PLAN.md'),
            'hotfix_report': os.path.join(task_dir, 'HOTFIX_REPORT.md'),
        }

        state.setdefault('artifacts', {})
        for key, path in artifact_map.items():
            if os.path.exists(path):
                state['artifacts'][key] = path

        write_state(state_file, state)
        print(f"✅ State transitioned to [{to_node}] (Status: {node_status})")
        return 0

    elif action == 'set-verdict':
        target = args.target or 'review'
        verdict = (args.verdict or 'PASS').upper()
        state = read_state(state_file, task_id)

        if target == 'review':
            state['review_cycles'] = state.get('review_cycles', 0) + 1
            state['last_review_verdict'] = verdict
            if verdict == 'FAIL':
                if state['review_cycles'] > 3:
                    state['status'] = 'CIRCUIT_BREAKER_ESCALATED'
                    state['current_node'] = 'user_escalation_gate'
                    print("⚠️ CIRCUIT BREAKER TRIGGERED: 3 failed review cycles reached. Escalating to human authority.")
                else:
                    state['status'] = 'REMEDIATING'
                    state['current_node'] = 'node_2_implementation'
                    print(f"\U0001f504 Review FAILED (Cycle {state['review_cycles']}/3). Routing back to Implementation Engineer.")
            else:
                state['current_node'] = 'node_4_qa_validator'
                state['status'] = 'RUNNING'
                print("✅ Review PASSED. Advancing to QA Validator.")
        elif target == 'qa':
            state['qa_cycles'] = state.get('qa_cycles', 0) + 1
            state['last_qa_verdict'] = verdict
            if verdict == 'FAIL':
                state['status'] = 'REMEDIATING'
                state['current_node'] = 'node_2_implementation'
                print("\U0001f504 QA FAILED. Routing back to Implementation Engineer.")
            else:
                state['current_node'] = 'gate_6_user_final_verdict'
                state['status'] = 'WAITING_USER_APPROVAL'
                print("✅ QA PASSED. Advancing to User Final Verdict Gate.")
        elif target in state.get('gate_checkpoints', {}):
            state['gate_checkpoints'][target] = verdict
            print(f"✅ Gate checkpoint [{target}] set to {verdict}")

        write_state(state_file, state)
        return 0

    elif action == 'status':
        state = read_state(state_file, task_id)
        print(json.dumps(state, indent=4))
        return 0

    else:
        sys.stderr.write(f"❌ ERROR: Unknown action '{action}'. Supported: init, transition, set-verdict, status\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
