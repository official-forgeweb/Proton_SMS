import { createRoot } from 'react-dom/client';
import CustomDialog from '@/components/CustomDialog';

export const customConfirm = (message: string, title: string = 'Confirm Action'): Promise<boolean> => {
    return new Promise((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const handleClose = (result: boolean) => {
            root.unmount();
            container.remove();
            resolve(result);
        };

        root.render(<CustomDialog title={title} message={message} onResolve={handleClose} isConfirm={true} />);
    });
};

export const customAlert = (message: string, title: string = 'Alert'): Promise<void> => {
    return new Promise((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const handleClose = () => {
            root.unmount();
            container.remove();
            resolve();
        };

        root.render(<CustomDialog title={title} message={message} onResolve={handleClose} isConfirm={false} />);
    });
};
