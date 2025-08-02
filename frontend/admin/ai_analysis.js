document.addEventListener('DOMContentLoaded', () => {
    const runAnalysisBtn = document.getElementById('run-analysis-btn');
    const resultsContainer = document.getElementById('analysis-results');
    const difficultySelector = document.getElementById('guest-ai-difficulty');
    const getQTableBtn = document.getElementById('get-q-table-btn');
    const qTablePlayerSelector = document.getElementById('q-table-player');
    const qTableResultsContainer = document.getElementById('q-table-results');
    const logoutBtn = document.getElementById('logout-btn');
    const api = new AdminAPI();

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin';
        });
    }

    runAnalysisBtn.addEventListener('click', async () => {
        resultsContainer.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Running analysis...</div>';
        const difficulty = difficultySelector.value;
        try {
            // Start the API call
            const resultsPromise = api.runAiAnalysis(difficulty);
            // Add a minimum delay of 2.5 seconds for realistic loading
            const delayPromise = new Promise(resolve => setTimeout(resolve, 2500));
            
            // Wait for both the API call and the delay to complete
            const [results] = await Promise.all([resultsPromise, delayPromise]);
            displayResults(results);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="loading-message"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</div>`;
        }
    });

    getQTableBtn.addEventListener('click', async () => {
        const player = qTablePlayerSelector.value;
        qTableResultsContainer.innerHTML = `<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Fetching Q-table for ${player}...</div>`;
        try {
            // Start the API call
            const qTablePromise = api.getQTable(player);
            // Add a minimum delay of 1.5 seconds for realistic loading
            const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
            
            // Wait for both the API call and the delay to complete
            const [qTable] = await Promise.all([qTablePromise, delayPromise]);
            displayQTable(qTable);
        } catch (error) {
            qTableResultsContainer.innerHTML = `<div class="loading-message"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</div>`;
        }
    });

    function displayResults(results) {
        const { q_learning_wins, guest_ai_wins, draws } = results;
        
        // Calculate total games first
        const totalGames = q_learning_wins + guest_ai_wins + draws;
        
        // Get performance comparison data from results
        const performanceData = results.results && results.results[0] && results.results[0].algorithm_comparison;
        
        // Clear previous results - only show comparison table
        resultsContainer.innerHTML = '';
        
        // Start with table HTML only
        let summaryHtml = ``;

        // Add detailed comparison table if performance data is available
        if (performanceData) {
            const qlData = performanceData.double_q_learning;
            const miniMaxData = performanceData.minimax;
            
            summaryHtml += `
                <div class="comparison-table">
                    <h4><i class="fas fa-chart-bar"></i> Detailed Algorithm Comparison</h4>
                    <table class="performance-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Double Q-Learning</th>
                                <th>Minimax (Guest AI)</th>
                                <th>Advantage</th>
                            </tr>
                        </thead>
                        <tbody>
                                                         <tr>
                                 <td><strong>Win Rate (Tiger vs Fixed Rule Based AI)</strong></td>
                                 <td class="highlight">${qlData.win_rate_as_tiger}%</td>
                                 <td>${miniMaxData.win_rate_as_tiger}%</td>
                                 <td class="advantage">Q-Learning +${(qlData.win_rate_as_tiger - miniMaxData.win_rate_as_tiger).toFixed(1)}%</td>
                             </tr>
                             <tr>
                                 <td><strong>Win Rate (Goat vs Fixed Rule Based AI)</strong></td>
                                 <td class="highlight">${qlData.win_rate_as_goat}%</td>
                                 <td>${miniMaxData.win_rate_as_goat}%</td>
                                 <td class="advantage">Q-Learning +${(qlData.win_rate_as_goat - miniMaxData.win_rate_as_goat).toFixed(1)}%</td>
                             </tr>
                            <tr>
                                <td><strong>Avg Game Length</strong></td>
                                <td>${qlData.avg_game_length} moves</td>
                                <td>${miniMaxData.avg_game_length} moves</td>
                                <td>${qlData.avg_game_length > miniMaxData.avg_game_length ? 'Longer games' : 'More efficient'}</td>
                            </tr>
                            <tr>
                                <td><strong>Decision Time</strong></td>
                                <td class="highlight">${qlData.decision_time_ms}ms</td>
                                <td>${miniMaxData.decision_time_ms}ms</td>
                                <td class="advantage">Q-Learning ${((miniMaxData.decision_time_ms / qlData.decision_time_ms)).toFixed(1)}x faster</td>
                            </tr>
                            <tr>
                                <td><strong>Training Time</strong></td>
                                <td>${qlData.training_time_minutes} min</td>
                                <td>N/A (No training)</td>
                                <td>One-time investment</td>
                            </tr>
                            <tr>
                                <td><strong>States Explored</strong></td>
                                <td class="highlight">${qlData.states_explored.toLocaleString()}</td>
                                <td>${miniMaxData.states_explored.toLocaleString()}</td>
                                <td class="advantage">Q-Learning +${((qlData.states_explored / miniMaxData.states_explored) * 100 - 100).toFixed(0)}% more</td>
                            </tr>
                            <tr>
                                <td><strong>Adaptiveness Score</strong></td>
                                <td class="highlight">${qlData.adaptiveness_score}/100</td>
                                <td>${miniMaxData.adaptiveness_score}/100</td>
                                <td class="advantage">Q-Learning superior learning</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;


        }
        
        resultsContainer.innerHTML += summaryHtml;
    }

    function displayQTable(qTableData) {
        const { player, q_table_size, total_state_action_pairs, sample_entries, statistics } = qTableData;
        
        let html = `
            <div class="q-table-summary">
                <h4><i class="fas fa-table"></i> Q-Table for ${player} Agent</h4>
                <div class="q-table-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total States:</span>
                        <span class="stat-value">${q_table_size}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">State-Action Pairs:</span>
                        <span class="stat-value">${total_state_action_pairs}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Max Q-Value:</span>
                        <span class="stat-value">${statistics.max_q_value.toFixed(3)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Min Q-Value:</span>
                        <span class="stat-value">${statistics.min_q_value.toFixed(3)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average Q-Value:</span>
                        <span class="stat-value">${statistics.avg_q_value}</span>
                    </div>
                </div>
            </div>
        `;
        
        html += '<div class="q-table-container"><table class="q-table"><thead><tr><th>State</th><th>Action</th><th>Q-Value</th></tr></thead><tbody>';
        
        let rowCount = 0;
        const maxRows = 50; // Limit display to prevent browser freeze
        
        for (const state in sample_entries) {
            for (const action in sample_entries[state]) {
                if (rowCount >= maxRows) break;
                const qValue = sample_entries[state][action];
                const colorClass = qValue > 0 ? 'positive-q' : qValue < 0 ? 'negative-q' : 'neutral-q';
                html += `<tr><td>${state}</td><td>${action}</td><td class="${colorClass}">${qValue.toFixed(3)}</td></tr>`;
                rowCount++;
            }
            if (rowCount >= maxRows) break;
        }
        
        if (rowCount >= maxRows) {
            html += `<tr><td colspan="3"><em>Showing first ${maxRows} entries of ${total_state_action_pairs} total...</em></td></tr>`;
        }
        
        html += '</tbody></table></div>';
        qTableResultsContainer.innerHTML = html;
    }
}); 