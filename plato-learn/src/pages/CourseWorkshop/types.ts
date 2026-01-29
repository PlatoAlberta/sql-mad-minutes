import { QuestionType } from '../../types';

export type SelectionType = 'course' | 'round' | 'question';

export interface Selection {
    type: SelectionType;
    id: string; // The ID of the round or question (or 'root' for course)
    parentId?: string; // For questions, the round ID
}

export type DraggedItem = {
    type: 'round' | 'question' | 'template';
    id?: string;
    parentId?: string;
    templateType?: QuestionType;
};
