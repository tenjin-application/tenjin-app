import { useState } from 'react';

import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

import type { Group } from '@shared/types';

// A form group needs to be passed a group, and furthermore an onSend function.
type RequestFormProps = {
    group: Group;
    onSend: (message: string) => Promise<void>;
};

export function RequestForm({ group, onSend }: RequestFormProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    /**
     * Attempts to submit the request form attempt.
     * @param {React.SubmitEvent} e - Event that corresponds to the submission.
     */
    async function handleSendRequest(e: React.SubmitEvent) {
        e.preventDefault()
        setError('');
        setIsSending(true);
        
        try {
            await onSend(message);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsSending(false);
        }
    }
    
    return (
        <form onSubmit={handleSendRequest} className="space-y-4">
            <p className="text-slate-600">
                The owner of <span 
                    className="text-brand font-medium truncate inline-block max-w-50 align-bottom"
                    title={group.name}
                >
                        {group.name}
                    </span> 
                will see your message.
            </p>
            <Textarea
                label="Message (optional):"
                hint={`${message.length}/300`}
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ resize: 'none' }}
                placeholder="The moment man devoured the fruit of knowledge, he sealed his fate..."
            />
            <Button
                variant="primary"
                type="submit"
                disabled={isSending}
                className="w-full"
            >
                {isSending ? "Sending..." : "Send request"}
            </Button>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
    );
}