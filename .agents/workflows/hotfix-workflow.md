<!-- TEMPLATE_VERSION: 2.1.0 -->
---
description: Fast-track, token-optimized hotfix state graph workflow for critical bugs, crashes, regressions, and security patches.
---

# Fast-Track Hotfix State Graph Workflow

A streamlined, token-efficient hotfix state machine designed for rapid, surgical remediation of production bugs, regressions, or security issues in **CPSU Scholarship API**.

---

## 1. Hotfix State Graph Flow

```mermaid
stateDiagram-v2
    [*] --> Node_RootCause: State Init (manage-state.py --action=init --task=hotfix/...)
    
    Node_RootCause --> Node_HotfixImplementer: Slice Context Extracted
    
    Node_HotfixImplementer --> Node_AdversarialDiffCheck: validate-artifact (HOTFIX_PLAN)
    
    Node_AdversarialDiffCheck --> Node_HotfixImplementer: Review FAIL (Zero collateral check)
    Node_AdversarialDiffCheck --> Node_TargetedQA: Review PASS
    
    Node_TargetedQA --> Node_HotfixImplementer: Test FAIL
    Node_TargetedQA --> Gate_EmergencyUserApproval: Test PASS
    
    state Gate_EmergencyUserApproval {
        [*] --> UserEmergencySignoff
    }
    
    Gate_EmergencyUserApproval --> Node_HotfixRelease: Approved
    Gate_EmergencyUserApproval --> Node_HotfixImplementer: Rejected
    
    Node_HotfixRelease --> [*]: State COMPLETED + Git PR
```

---

## 2. State Machine Execution Steps

### Step 1: State Init & Root-Cause Analysis
1. **Initialize State**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=init --task=hotfix/<slug> --complexity=SMALL
   ```
2. **Context Policy**: Read error stack trace / bug description + exact defective file.
3. **Action**: Pinpoint root cause using line slice reads (`view_file` with line range).
4. **Output**: `.agent-work/hotfix-<slug>/HOTFIX_CONTEXT.md`.
5. **Transition**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=transition --task=hotfix/<slug> --to=node_hotfix_implementer
   ```

---

### Step 2: Hotfix Implementation (Surgical Patch)
1. **Context Policy**: Read `STATE.json`, `HOTFIX_CONTEXT.md`, and exact defective file.
2. **Action**:
   - Draft `.agent-work/hotfix-<slug>/HOTFIX_PLAN.md` (exact lines to touch).
   - Apply smallest surgical fix possible (no unrequested refactoring).
   - Review `git diff`.
3. **Output**: `HOTFIX_REPORT.md`.
4. **Transition**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=transition --task=hotfix/<slug> --to=node_adversarial_diff_check
   ```

---

### Step 3: Adversarial Diff Review
1. **Context Policy**: Read `git diff` + `.agents/memory/conventions.md`.
2. **Action**: Verify patch does not cause regressions, introduce concurrency risks, or break tenant isolation.
3. **Output**: `CODE_REVIEW.md` (`CODE_REVIEW_STATUS: PASS | FAIL`).
4. **Conditional Edge**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=set-verdict --task=hotfix/<slug> --target=review --verdict=<PASS|FAIL>
   ```

---

### Step 4: Targeted QA Verification
1. **Context Policy**: Read `git diff` + affected test file.
2. **Action**: Run targeted test command: `bun run test`.
3. **Output**: `QA_REPORT.md` (with short Manual Verification Checklist).
4. **Conditional Edge**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=set-verdict --task=hotfix/<slug> --target=qa --verdict=<PASS|FAIL>
   ```

---

### Step 5: User Emergency Gate
1. **Action**: Present minimal diff and verification steps to user.
2. **PAUSE AND WAIT** for user confirmation (`approved`, `complete`, `ship it`).
3. **Transition**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=transition --task=hotfix/<slug> --to=node_hotfix_release
   ```

---

### Step 6: Hotfix Release
1. **Action**:
   - Append entry to `MEMORY_ARCHIVE.md` and pointer row to `MEMORY.md`.
   - Create hotfix commit: `fix(<scope>): <concise description>`.
   - Create pull request to target base branch (`dev / main`).
2. **State Complete**:
   ```bash
   python3 .agents/scripts/manage-state.py --action=transition --task=hotfix/<slug> --to=completed --status=COMPLETED
   ```
