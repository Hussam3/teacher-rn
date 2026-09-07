import {
  createNamedDraft,
  listNamedDrafts,
  restoreNamedDraft,
} from '../src/features/editor/drafts';
import {
  DEFAULT_PRINT_SETTINGS,
  EMPTY_EXAM_HEADER,
  normalizeEditorDocument,
  type EditorDocument,
} from '../src/shared/types/editor';

const workingDocument: EditorDocument = {
  id: 'current',
  title: 'ورقة العمل',
  header: { ...EMPTY_EXAM_HEADER },
  blocks: [
    {
      id: 'question-1',
      type: 'question',
      text: 'عرّف الذرة.',
      questionMode: 'direct',
      score: '5',
      branches: [],
    },
  ],
  printSettings: { ...DEFAULT_PRINT_SETTINGS },
  updatedAt: '2026-09-05T10:00:00.000Z',
};

describe('المسودات المسماة للمحرر', () => {
  it('ينشئ نسخة مسماة مستقلة ولا يستبدل المستند الجاري', () => {
    const draft = createNamedDraft(
      workingDocument,
      ' امتحان الفصل الأول ',
      'draft-1',
      '2026-09-05T11:00:00.000Z',
    );

    expect(draft).toMatchObject({
      id: 'draft-1',
      title: 'امتحان الفصل الأول',
      updatedAt: '2026-09-05T11:00:00.000Z',
    });
    expect(draft.blocks).toEqual(workingDocument.blocks);
    expect(workingDocument.id).toBe('current');
  });

  it('يعرض المسودات المسماة فقط من الأحدث إلى الأقدم', () => {
    const older = createNamedDraft(
      workingDocument,
      'القديمة',
      'draft-old',
      '2026-09-04T10:00:00.000Z',
    );
    const newer = createNamedDraft(
      workingDocument,
      'الأحدث',
      'draft-new',
      '2026-09-05T12:00:00.000Z',
    );

    expect(
      listNamedDrafts([workingDocument, older, newer]).map(draft => draft.id),
    ).toEqual(['draft-new', 'draft-old']);
  });

  it('يسترجع نسخة إلى مستند العمل دون تغيير المصدر المحفوظ', () => {
    const draft = createNamedDraft(
      workingDocument,
      'اختبار محفوظ',
      'draft-1',
      '2026-09-05T11:00:00.000Z',
    );
    const restored = restoreNamedDraft(draft, '2026-09-05T13:00:00.000Z');

    expect(restored).toMatchObject({
      id: 'current',
      title: 'اختبار محفوظ',
      updatedAt: '2026-09-05T13:00:00.000Z',
    });
    expect(restored.blocks).toEqual(draft.blocks);
    expect(draft.id).toBe('draft-1');
    expect(draft.updatedAt).toBe('2026-09-05T11:00:00.000Z');
  });

  it('يملأ الحقول المفقودة في المسودات المحفوظة قبل إضافة إعدادات جديدة', () => {
    const legacyDocument = {
      ...workingDocument,
      header: {
        schoolName: 'مدرسة قديمة',
        subject: 'رياضيات',
        grade: 'الثاني',
        examTitle: '',
        academicYear: '',
        duration: '',
        date: '',
        teacherName: '',
        subjectId: null,
        showBismillah: false,
      },
      printSettings: { marginMm: 12 },
      blocks: [
        {
          id: 'legacy-question',
          type: 'question',
          text: 'سؤال قديم',
          score: '',
        },
      ],
    } as unknown as EditorDocument;

    const normalized = normalizeEditorDocument(legacyDocument);

    expect(normalized.header.round).toBe('');
    expect(normalized.header.track).toBe('');
    expect(normalized.printSettings).toMatchObject({
      marginMm: 12,
      fontSize: DEFAULT_PRINT_SETTINGS.fontSize,
      autoFit: false,
    });
    expect(normalized.blocks[0]).toMatchObject({
      questionMode: 'direct',
      branches: [],
    });
  });
});
