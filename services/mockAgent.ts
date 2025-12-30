import { Message, ToolCall } from '../types';

// Simulates the latency and logic of the specialized agents (Strategic Advisor, Filter Manager, etc.)
export const simulateAgentResponse = async (
    input: string, 
    history: Message[],
    dispatch: (cmd: string, payload: any) => Promise<string>
): Promise<{ text: string, toolCalls?: ToolCall[], suggestions?: string[] }> => {
    
    // 1. Detect Slash Commands (The "Slash Command Intelligence" from Week 6)
    if (input.startsWith('/')) {
        const [cmd, ...args] = input.split(' ');
        const payload = args.join(' ');

        // Simulate tool execution visualization
        const toolCall: ToolCall = {
            id: Date.now().toString(),
            name: cmd,
            status: 'running',
            input: payload
        };

        // Artificial delay for tool execution
        await new Promise(r => setTimeout(r, 1500));
        
        const result = await dispatch(cmd, payload);
        
        toolCall.status = 'completed';
        toolCall.output = result;

        return {
            text: `Executed ${cmd}. ${result}`,
            toolCalls: [toolCall],
            suggestions: ['Undo', 'View Details']
        };
    }

    // 2. Pattern Matching for "Context Aware" responses
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('morning') || lowerInput.includes('start day')) {
        return {
            text: "Good morning, Michael. I've run the `/overview` protocol. Your Calendar looks clear until 12pm (BJJ). Decopon outreach is the priority.",
            toolCalls: [
                { id: '1', name: 'check-calendar', status: 'completed', output: 'Clear until 12:00' },
                { id: '2', name: 'refresh-relationships', status: 'completed', output: 'Updated 3 files from sent mail' }
            ],
            suggestions: ['Start Outreach', 'Review BJJ Notes']
        };
    }

    if (lowerInput.includes('email') || lowerInput.includes('inbox')) {
        return {
            text: "Scanning simulated inbox... I found 5 newsletter updates and 2 receipts. Archiving those. There is one thread from 'Google Friend' that needs a reply regarding the warm intro.",
            toolCalls: [
                { id: '3', name: 'filter-manager', status: 'completed', output: 'Archived 7 items (95% confidence)' }
            ],
            suggestions: ['Draft Reply', 'Snooze']
        };
    }

    // 3. Fallback to Gemini (via Service) if no local pattern matches
    // In this simulation, we return a generic "AI" response if not specific
    return {
        text: "I've logged that. Anything else for the protocol memory?",
        suggestions: ['Save to Sparkfile', 'Create Task']
    };
};
