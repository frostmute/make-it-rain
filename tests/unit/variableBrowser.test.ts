import { App } from 'obsidian';
import { VariableBrowserModal } from '../../src/modals';

// Mock Obsidian App
const mockApp = {
    workspace: {}
} as unknown as App;

describe('VariableBrowserModal', () => {
    let modal: VariableBrowserModal;

    beforeEach(() => {
        modal = new VariableBrowserModal(mockApp);
    });

    it('should be instantiable', () => {
        expect(modal).toBeDefined();
    });

    it('should have an onOpen method', () => {
        expect(modal.onOpen).toBeDefined();
        expect(typeof modal.onOpen).toBe('function');
    });
});
