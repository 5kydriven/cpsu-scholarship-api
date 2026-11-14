<?php
declare(strict_types=1);

/**
 * Deterministic State Graph Engine (In-House Micro-LangGraph)
 * 
 * Manages atomic task state transitions, loop counters, and human gate checkpoints
 * in .agent-work/<TASK_ID>/STATE.json in <1ms on CPU with ZERO LLM tokens.
 * 
 * Usage:
 *   php .agents/scripts/manage-state.php --action=init --task=feat/oauth-sign-in --complexity=MEDIUM
 *   php .agents/scripts/manage-state.php --action=transition --task=feat/oauth-sign-in --to=node_1_architect
 *   php .agents/scripts/manage-state.php --action=set-verdict --task=feat/oauth-sign-in --target=review --verdict=PASS
 *   php .agents/scripts/manage-state.php --action=status --task=feat/oauth-sign-in
 */

$options = getopt('', ['action:', 'task:', 'to:', 'complexity:', 'target:', 'verdict:', 'status:']);
$action = $options['action'] ?? null;
$taskId = $options['task'] ?? null;

if (!$action || !$taskId) {
    fwrite(STDERR, "❌ Usage: php manage-state.php --action=<init|transition|set-verdict|status> --task=<TASK_ID> [options]\n");
    exit(1);
}

$workDir = realpath(__DIR__ . '/../../.agent-work');
if (!$workDir) {
    $workDir = __DIR__ . '/../../.agent-work';
    if (!is_dir($workDir)) {
        mkdir($workDir, 0755, true);
    }
}

$taskDir = $workDir . '/' . $taskId;
if (!is_dir($taskDir)) {
    mkdir($taskDir, 0755, true);
}

$stateFile = $taskDir . '/STATE.json';

function readState(string $file, string $taskId, string $complexity = 'MEDIUM'): array {
    if (file_exists($file)) {
        $data = json_decode((string)file_get_contents($file), true);
        if (is_array($data)) return $data;
    }
    return [
        'task_id' => $taskId,
        'workflow_type' => str_starts_with($taskId, 'hotfix') ? 'HOTFIX' : 'FEATURE',
        'complexity' => $complexity,
        'current_node' => 'node_0_context_builder',
        'status' => 'INITIALIZED',
        'review_cycles' => 0,
        'qa_cycles' => 0,
        'artifacts' => [],
        'gate_checkpoints' => [
            'gate_0_scope' => 'PENDING',
            'gate_1_architecture' => 'PENDING',
            'gate_6_final_verdict' => 'PENDING',
        ],
        'updated_at' => date('c'),
    ];
}

function writeState(string $file, array $state): void {
    $state['updated_at'] = date('c');
    file_put_contents($file, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

switch ($action) {
    case 'init':
        $complexity = $options['complexity'] ?? 'MEDIUM';
        $state = readState($stateFile, $taskId, $complexity);
        $state['complexity'] = $complexity;
        $state['status'] = 'INITIALIZED';
        $state['current_node'] = str_starts_with($taskId, 'hotfix') ? 'node_hotfix_root_cause' : 'node_0_context_builder';
        writeState($stateFile, $state);
        echo "✅ Task State Graph initialized for [{$taskId}] (Complexity: {$complexity})\n";
        echo "   State File: {$stateFile}\n";
        exit(0);

    case 'transition':
        $toNode = $options['to'] ?? null;
        $nodeStatus = $options['status'] ?? 'RUNNING';
        if (!$toNode) {
            fwrite(STDERR, "❌ ERROR: Missing --to=<node_name>\n");
            exit(1);
        }
        $state = readState($stateFile, $taskId);
        $state['current_node'] = $toNode;
        $state['status'] = $nodeStatus;

        $artifactMap = [
            'task_context' => "{$taskDir}/TASK_CONTEXT.md",
            'task_packet' => "{$taskDir}/TASK_PACKET.md",
            'architecture_plan' => "{$taskDir}/ARCHITECTURE_PLAN.md",
            'implementation_plan' => "{$taskDir}/IMPLEMENTATION_PLAN.md",
            'implementation_report' => "{$taskDir}/IMPLEMENTATION_REPORT.md",
            'code_review' => "{$taskDir}/CODE_REVIEW.md",
            'qa_report' => "{$taskDir}/QA_REPORT.md",
            'release_report' => "{$taskDir}/RELEASE_REPORT.md",
            'hotfix_context' => "{$taskDir}/HOTFIX_CONTEXT.md",
            'hotfix_plan' => "{$taskDir}/HOTFIX_PLAN.md",
            'hotfix_report' => "{$taskDir}/HOTFIX_REPORT.md",
        ];

        foreach ($artifactMap as $key => $path) {
            if (file_exists($path)) {
                $state['artifacts'][$key] = $path;
            }
        }

        writeState($stateFile, $state);
        echo "✅ State transitioned to [{$toNode}] (Status: {$nodeStatus})\n";
        exit(0);

    case 'set-verdict':
        $target = $options['target'] ?? 'review';
        $verdict = strtoupper($options['verdict'] ?? 'PASS');
        $state = readState($stateFile, $taskId);

        if ($target === 'review') {
            $state['review_cycles']++;
            $state['last_review_verdict'] = $verdict;
            if ($verdict === 'FAIL') {
                if ($state['review_cycles'] > 3) {
                    $state['status'] = 'CIRCUIT_BREAKER_ESCALATED';
                    $state['current_node'] = 'user_escalation_gate';
                    echo "⚠️ CIRCUIT BREAKER TRIGGERED: 3 failed review cycles reached. Escalating to human authority.\n";
                } else {
                    $state['status'] = 'REMEDIATING';
                    $state['current_node'] = 'node_2_implementation';
                    echo "🔄 Review FAILED (Cycle {$state['review_cycles']}/3). Routing back to Implementation Engineer.\n";
                }
            } else {
                $state['current_node'] = 'node_4_qa_validator';
                $state['status'] = 'RUNNING';
                echo "✅ Review PASSED. Advancing to QA Validator.\n";
            }
        } elseif ($target === 'qa') {
            $state['qa_cycles']++;
            $state['last_qa_verdict'] = $verdict;
            if ($verdict === 'FAIL') {
                $state['status'] = 'REMEDIATING';
                $state['current_node'] = 'node_2_implementation';
                echo "🔄 QA FAILED. Routing back to Implementation Engineer.\n";
            } else {
                $state['current_node'] = 'gate_6_user_final_verdict';
                $state['status'] = 'WAITING_USER_APPROVAL';
                echo "✅ QA PASSED. Advancing to User Final Verdict Gate.\n";
            }
        } elseif (isset($state['gate_checkpoints'][$target])) {
            $state['gate_checkpoints'][$target] = $verdict;
            echo "✅ Gate checkpoint [{$target}] set to {$verdict}\n";
        }

        writeState($stateFile, $state);
        exit(0);

    case 'status':
        $state = readState($stateFile, $taskId);
        echo json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
        exit(0);

    default:
        fwrite(STDERR, "❌ ERROR: Unknown action '{$action}'. Supported: init, transition, set-verdict, status\n");
        exit(1);
}
