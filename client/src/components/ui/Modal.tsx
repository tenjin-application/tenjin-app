import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

// Properties needed for our modal.
type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Essentially, we use a ref to access the direct methods for the modal, utilizing an open state and the current dialog status to open or close it.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            className="w-full max-w-xl rounded-2xl p-6 border-2 border-slate-300 shadow-md backdrop:bg-black/70 m-auto"
        >
            <div className="space-y-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                <button 
                    type="button" 
                    onClick={onClose} 
                    aria-label="Close"
                    className="text-xl font-semibold hover:text-brand"
                >X</button>
            </div>
            {children}
        </dialog>
    )
}