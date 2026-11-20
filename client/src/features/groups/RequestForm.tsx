import { useState } from 'react';
import type { Group } from '@shared/types';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

type RequestFormProps = {
    group: Group;
    onSend: (message: string) => Promise<void>;
};

export function RequestForm({ group, onSend }: RequestFormProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    // Handles how sending behaves, based on the passed in onSend function.
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
            <p className="text-slate-600">The owner of <span className="text-brand">{group.name}</span> will see your message.</p>
            <Textarea
                label="Message (optional):"
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="The moment man devoured the fruit of knowledge, he sealed his fate..."
                className="resize-none"
            />
            <Button
                variant="primary"
                type="submit"
                disabled={isSending}
                className="w-full"
            >Send request</Button>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
    );
}