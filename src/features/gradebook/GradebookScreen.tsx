/**
 * شاشة سجل الدرجات — جدول بصفوف الطلاب وأعمدة الدرجات مع أعمدة محسوبة.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { FONT_FAMILY, radius } from '../../shared/theme/tokens';
import { strings } from '../../shared/i18n/ar';
import { AppScreen } from '../../shared/ui/AppScreen';
import { Button } from '../../shared/ui/Button';
import { SelectField } from '../../shared/ui/SelectField';
import { Dialog } from '../../shared/ui/Dialog';
import { Sheet } from '../../shared/ui/Sheet';
import { TextField } from '../../shared/ui/TextField';
import { PressableScale } from '../../shared/ui/PressableScale';
import { Icon, type IconProps } from '../../shared/ui/Icon';
import { EmptyState } from '../../shared/ui/EmptyState';
import { showError, showSuccess } from '../../shared/ui/toast';
import { subjectRepo, gradebookRepo } from '../../data/repositories';
import { useScheduleStore } from '../schedule/scheduleStore';
import type {
  GradeBook,
  GradeColumn,
  Student,
} from '../../shared/types/domain';
import {
  columnPassRate,
  columnValue,
  computeStats,
  studentTotal,
} from '../../shared/utils/gradebook';
import { parseNames } from '../../shared/utils/names';
import { newId } from '../../shared/utils/id';
import { todayISO } from '../../shared/utils/date';
import { generateGradebookPdf } from '../../services/pdfService';
import { printPdf } from '../../services/printService';
import { getAIService } from '../../services/aiService';
import { launchImageLibrary } from 'react-native-image-picker';
import { StudentEditor } from './StudentEditor';

const NAME_COL_WIDTH = 120;
const COL_WIDTH = 64;
const HEADER_H = 48;
const FOOTER_H = 48;

type SortMode = 'alpha' | 'grade' | 'manual';

const SORT_LABELS: Record<SortMode, string> = {
  alpha: strings.gradebook.sortAlphabetical,
  grade: strings.gradebook.sortByGrade,
  manual: strings.gradebook.sortManual,
};

export function GradebookScreen() {
  const { colors } = useTheme();
  const subjects = useScheduleStore(s => s.subjects);

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [gradebook, setGradebook] = useState<GradeBook | null>(null);
  const [saved, setSaved] = useState<GradeBook[]>([]);
  const [createGradebookOpen, setCreateGradebookOpen] = useState(false);
  const [newGradebookTitle, setNewGradebookTitle] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('');

  const [colDialog, setColDialog] = useState<{
    editing: GradeColumn | null;
  } | null>(null);
  const [studentDialog, setStudentDialog] = useState<Student | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [singleAddOpen, setSingleAddOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [reviewNames, setReviewNames] = useState<string[] | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [gradeEdit, setGradeEdit] = useState<{
    student: Student;
    column: GradeColumn;
  } | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [columnEntry, setColumnEntry] = useState<GradeColumn | null>(null);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [tableHeight, setTableHeight] = useState<number | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const nameScroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const gradeScroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const syncing = useRef(false);
  const gradebookRef = useRef<GradeBook | null>(null);
  gradebookRef.current = gradebook;

  const reload = useCallback(() => {
    setSaved(gradebookRepo.list());
    const gb = gradebookRef.current;
    if (gb) {
      const fresh = gradebookRepo.get(gb.id);
      if (fresh) setGradebook(fresh);
    }
  }, []);

  useFocusEffect(reload);

  const subjectOptions = useMemo(
    () =>
      Object.values(subjects).map(s => ({
        label: `${s.name} - ${s.grade}`,
        value: s.id,
      })),
    [subjects],
  );

  const selectedSubject = subjectId ? subjectRepo.get(subjectId) : undefined;

  const openCreateGradebook = () => {
    if (!subjectId) return;
    setNewGradebookTitle('');
    setNewClassName(selectedSubject?.grade ?? '');
    setNewAcademicYear(String(new Date().getFullYear()));
    setCreateGradebookOpen(true);
  };

  const createGradebook = () => {
    if (!subjectId || !newGradebookTitle.trim()) return;
    const gb: GradeBook = {
      id: newId(),
      subjectId,
      title: newGradebookTitle.trim(),
      className: newClassName.trim() || selectedSubject?.grade || '',
      academicYear: newAcademicYear.trim() || String(new Date().getFullYear()),
      columns: [
        {
          id: newId(),
          name: 'شهري 1',
          maxScore: 100,
          weight: 10,
          isCalculated: false,
          includedColumnIds: [],
          calculationType: 'AVG',
        },
        {
          id: newId(),
          name: 'شهري 2',
          maxScore: 100,
          weight: 10,
          isCalculated: false,
          includedColumnIds: [],
          calculationType: 'AVG',
        },
      ],
      students: [],
      createdAt: todayISO(),
    };
    gradebookRepo.save(gb);
    setSaved(prev => [...prev, gb]);
    setGradebook(gb);
    setCreateGradebookOpen(false);
  };

  const syncScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
    target: 'name' | 'grade',
  ) => {
    if (syncing.current) return;
    syncing.current = true;
    const y = e.nativeEvent.contentOffset.y;
    if (target === 'name')
      gradeScroll.current?.scrollTo({ y, animated: false });
    else nameScroll.current?.scrollTo({ y, animated: false });
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  };

  const addSingleStudent = () => {
    if (!gradebook || !studentName.trim()) return;
    const student: Student = {
      id: newId(),
      name: studentName.trim(),
      order: gradebook.students.length,
      grades: {},
    };
    const updated = {
      ...gradebook,
      students: [...gradebook.students, student],
    };
    gradebookRepo.save(updated);
    setGradebook(updated);
    setStudentName('');
    setSingleAddOpen(false);
  };

  /** إضافة قائمة أسماء (لصق جماعي) بدون تكرار */
  const addStudentsBulk = () => {
    if (!gradebook) return;
    const names = parseNames(bulkText);
    const existing = new Set(gradebook.students.map(s => s.name.trim()));
    let order = gradebook.students.length;
    const added: Student[] = [];
    for (const name of names) {
      if (existing.has(name)) continue;
      existing.add(name);
      added.push({ id: newId(), name, order: order++, grades: {} });
    }
    if (added.length > 0) {
      const gb = { ...gradebook, students: [...gradebook.students, ...added] };
      gradebookRepo.save(gb);
      setGradebook(gb);
      showSuccess(
        strings.gradebook.addedStudents.replace(
          '{count}',
          String(added.length),
        ),
      );
    }
    setBulkOpen(false);
    setBulkText('');
  };

  const importableGradebooks = useMemo(() => {
    if (!gradebook) return [];
    return gradebookRepo
      .list()
      .filter(g => g.id !== gradebook.id)
      .map(g => ({
        label: `${g.className} (${g.students.length} ${strings.gradebook.students})`,
        value: g.id,
      }));
  }, [gradebook]);

  /** استيراد أسماء الطلاب فقط من سجل آخر */
  const importFromGradebook = () => {
    if (!gradebook || !importId) return;
    const source = gradebookRepo.get(importId);
    setImportOpen(false);
    setImportId(null);
    if (!source) return;
    const existing = new Set(gradebook.students.map(s => s.name.trim()));
    let order = gradebook.students.length;
    const added: Student[] = [];
    for (const s of source.students) {
      const name = s.name.trim();
      if (existing.has(name)) continue;
      existing.add(name);
      added.push({ id: newId(), name, order: order++, grades: {} });
    }
    if (added.length > 0) {
      const gb = { ...gradebook, students: [...gradebook.students, ...added] };
      gradebookRepo.save(gb);
      setGradebook(gb);
      showSuccess(
        strings.gradebook.importedStudents.replace(
          '{count}',
          String(added.length),
        ),
      );
    }
  };

  /** قراءة الأسماء من صورة بالذكاء الاصطناعي */
  const startImageFlow = () => {
    setAddMenuOpen(false);
    pickAndExtract();
  };

  const pickAndExtract = async () => {
    setImageBusy(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        selectionLimit: 1,
      });
      const asset = result.assets?.[0];
      if (!asset) return;
      const base64 = asset.base64 ?? '';
      if (!base64) {
        showError(strings.gradebook.extractFailed);
        return;
      }
      const service = getAIService();
      const names = await service.extractStudentNames(base64);
      if (names.length === 0) {
        showError(strings.gradebook.noNamesFound);
        return;
      }
      setReviewNames(names);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : strings.gradebook.extractFailed,
      );
    } finally {
      setImageBusy(false);
    }
  };

  const updateReviewName = (index: number, value: string) => {
    setReviewNames(prev =>
      prev ? prev.map((n, i) => (i === index ? value : n)) : prev,
    );
  };

  const removeReviewName = (index: number) => {
    setReviewNames(prev => (prev ? prev.filter((_, i) => i !== index) : prev));
  };

  const confirmReviewNames = () => {
    if (!gradebook || !reviewNames) return;
    const existing = new Set(gradebook.students.map(s => s.name.trim()));
    let order = gradebook.students.length;
    const added: Student[] = [];
    for (const raw of reviewNames) {
      const name = raw.trim();
      if (!name || existing.has(name)) continue;
      existing.add(name);
      added.push({ id: newId(), name, order: order++, grades: {} });
    }
    setReviewNames(null);
    if (added.length === 0) return;
    const gb = { ...gradebook, students: [...gradebook.students, ...added] };
    gradebookRepo.save(gb);
    setGradebook(gb);
    showSuccess(
      strings.gradebook.addedStudents.replace('{count}', String(added.length)),
    );
  };

  /** قائمة الطلاب المعروضة حسب وضع الفرز (الترتيب الحقيقي يبقى كما هو) */
  const displayStudents = useMemo(() => {
    if (!gradebook) return [];
    const list = [...gradebook.students];
    if (sortMode === 'alpha') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortMode === 'grade') {
      list.sort(
        (a, b) =>
          studentTotal(b, gradebook.columns) -
          studentTotal(a, gradebook.columns),
      );
    }
    return list;
  }, [gradebook, sortMode]);

  const saveGradebook = () => {
    if (!gradebook) return;
    gradebookRepo.save(gradebook);
    showSuccess(strings.gradebook.saved);
  };

  const saveGradeEdit = () => {
    if (!gradebook || !gradeEdit) return;
    const rawText = gradeValue.trim();
    const raw = Number(rawText);
    if (
      rawText !== '' &&
      (Number.isNaN(raw) || raw < 0 || raw > gradeEdit.column.maxScore)
    ) {
      showError(
        strings.gradebook.gradeInvalid.replace(
          '{max}',
          String(gradeEdit.column.maxScore),
        ),
      );
      return;
    }
    const students = gradebook.students.map(s => {
      if (s.id !== gradeEdit.student.id) return s;
      const grades = { ...s.grades };
      if (rawText === '') delete grades[gradeEdit.column.id];
      else grades[gradeEdit.column.id] = raw;
      return { ...s, grades };
    });
    const gb = { ...gradebook, students };
    gradebookRepo.save(gb);
    setGradebook(gb);
    setGradeEdit(null);
  };

  const handlePrint = async (blank = false) => {
    if (!gradebook) return;
    try {
      const path = await generateGradebookPdf(gradebook, selectedSubject, {
        blank,
      });
      await printPdf(path);
    } catch (e) {
      showError(String(e));
    }
  };

  const stats = gradebook ? computeStats(gradebook) : null;

  const scrollHeight =
    tableHeight == null
      ? undefined
      : Math.max(0, tableHeight - HEADER_H - FOOTER_H);

  return (
    <AppScreen edges={['top']}>
      {!gradebook ? (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {strings.gradebook.title}
          </Text>
        </View>
      ) : null}

      {!gradebook ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SelectField
            label={strings.common.subject}
            placeholder={strings.schedule.selectSubject}
            value={subjectId}
            options={subjectOptions}
            onChange={setSubjectId}
          />
          <Button
            label={strings.gradebook.createNew}
            onPress={openCreateGradebook}
            disabled={!subjectId}
            style={{ marginTop: 12 }}
          />

          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, marginTop: 24 },
            ]}
          >
            {strings.gradebook.saved}
          </Text>
          {saved.length === 0 ? (
            <EmptyState
              icon={{ name: 'leaderboard' }}
              title={strings.gradebook.noSaved}
            />
          ) : (
            saved.map(gb => {
              const subj = subjectRepo.get(gb.subjectId);
              return (
                <PressableScale
                  key={gb.id}
                  onPress={() => {
                    setSubjectId(gb.subjectId);
                    setGradebook(gb);
                  }}
                  haptic
                  style={styles.savedCardWrap}
                >
                  <View
                    style={[
                      styles.savedCard,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[styles.savedTitle, { color: colors.textPrimary }]}
                    >
                      {gb.title?.trim() || subj?.name || strings.common.unknown}
                    </Text>
                    <Text
                      style={[
                        styles.savedMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {[subj?.name, gb.className || subj?.grade, gb.academicYear]
                        .filter(Boolean)
                        .join(' • ')}{' '}
                      • {gb.students.length} {strings.gradebook.students}
                    </Text>
                  </View>
                </PressableScale>
              );
            })
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* الرأس المدمج: العنوان + الأفعال */}
          <View style={styles.headerBar}>
            <IconBtn
              icon="arrow-forward"
              onPress={() => {
                setGradebook(null);
                setColumnEntry(null);
                setSubjectId(null);
              }}
              color={colors.primary}
            />
            <View style={styles.headerBarTitle}>
              <Text
                style={[
                  styles.headerBarTitleText,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {gradebook.title?.trim() || strings.gradebook.title}
              </Text>
              {selectedSubject ? (
                <Text
                  style={[
                    styles.headerBarSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {selectedSubject.name} • {gradebook.className || selectedSubject.grade}
                </Text>
              ) : null}
            </View>
            <View style={styles.headerActions}>
              <IconBtn
                icon="add"
                onPress={() => setColDialog({ editing: null })}
                color={colors.primary}
              />
              <IconBtn
                icon="print"
                onPress={() => setPrintMenuOpen(true)}
                color={colors.primary}
              />
              <IconBtn
                icon="save"
                onPress={saveGradebook}
                color={colors.primary}
              />
            </View>
          </View>

          {/* شريط الإحصاءات والفرز المدمج */}
          <View style={[styles.metaBar, { backgroundColor: colors.surface }]}>
            {stats ? (
              <Text
                style={[styles.metaStats, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                <Text style={styles.metaBold}>
                  {stats.studentCount} {strings.gradebook.students}
                </Text>
                {stats.assessedCount === 0 ? (
                  <Text style={[styles.metaBold, { color: colors.textSecondary }]}>
                    {' · '}
                    {strings.gradebook.noGradesYet}
                  </Text>
                ) : (
                  <>
                    {' · '}
                    <Text style={[styles.metaBold, { color: colors.success }]}>
                      {stats.passCount} {strings.gradebook.pass}
                    </Text>
                    {' · '}
                    <Text style={[styles.metaBold, { color: colors.error }]}>
                      {stats.failCount} {strings.gradebook.fail}
                    </Text>
                    {' · '}
                    <Text style={[styles.metaBold, { color: colors.primary }]}>
                      {Math.round(stats.passRate)}%
                    </Text>
                  </>
                )}
              </Text>
            ) : null}
            <PressableScale
              onPress={() => setSortMenuOpen(true)}
              haptic
              animated={false}
              style={[styles.sortPill, { borderColor: colors.primary }]}
            >
              <Text
                style={[styles.sortPillText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {strings.gradebook.sort}: {SORT_LABELS[sortMode]}
              </Text>
              <Icon name="sort" size={16} color={colors.primary} />
            </PressableScale>
          </View>

          {/* الجدول */}
          <View
            style={styles.tableWrap}
            onLayout={e => setTableHeight(e.nativeEvent.layout.height)}
          >
            {/* عمود الأسماء المجمّد */}
            <View style={{ width: NAME_COL_WIDTH }}>
              <View
                style={[
                  styles.nameHeaderCell,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.headerText}>
                  {strings.gradebook.studentNameColumn}
                </Text>
              </View>
              <ScrollView
                ref={nameScroll}
                showsVerticalScrollIndicator={false}
                onScroll={e => syncScroll(e, 'name')}
                scrollEventThrottle={16}
                style={{ height: scrollHeight }}
              >
                {displayStudents.map((s, i) => (
                  <PressableScale
                    key={s.id}
                    onPress={() => setStudentDialog(s)}
                    animated={false}
                    style={[
                      styles.nameCell,
                      {
                        backgroundColor:
                          i % 2 === 0 ? colors.surface : colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.nameText, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {i + 1}. {s.name}
                    </Text>
                  </PressableScale>
                ))}
              </ScrollView>
              <View
                style={[
                  styles.nameFooterCell,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text
                  style={[styles.footerText, { color: colors.textSecondary }]}
                >
                  {strings.gradebook.passRate}
                </Text>
              </View>
            </View>

            {/* الأعمدة */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              style={styles.gradesPane}
            >
              <View style={{ height: tableHeight ?? undefined }}>
                <View style={styles.columnHeaderRow}>
                  {gradebook.columns.map(col => (
                    <PressableScale
                      key={col.id}
                      onPress={() => {
                        if (col.isCalculated) {
                          setColDialog({ editing: col });
                        } else {
                          setColumnEntry(col);
                        }
                      }}
                      animated={false}
                      style={[
                        styles.colHeaderCell,
                        {
                          width: COL_WIDTH,
                          backgroundColor: colors.primaryDark,
                        },
                      ]}
                    >
                      <Text style={styles.headerText} numberOfLines={2}>
                        {col.name}
                      </Text>
                      <Text style={styles.headerSmall}>
                        {col.isCalculated
                          ? col.calculationType === 'SUM'
                            ? 'Σ'
                            : 'ƒ'
                          : `(${col.maxScore})`}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
                <ScrollView
                  ref={gradeScroll}
                  showsVerticalScrollIndicator={false}
                  onScroll={e => syncScroll(e, 'grade')}
                  scrollEventThrottle={16}
                  style={{ height: scrollHeight }}
                >
                  {displayStudents.map((s, i) => (
                    <View key={s.id} style={styles.rowCells}>
                      {gradebook.columns.map(col => {
                        const storedValue = s.grades[col.id];
                        const val = col.isCalculated
                          ? columnValue(s, col)
                          : storedValue;
                        const red = val != null && val < col.maxScore / 2;
                        return (
                          <PressableScale
                            key={col.id}
                            onPress={() => {
                                  if (!col.isCalculated) {
                                    setGradeEdit({ student: s, column: col });
                                    setGradeValue(
                                      s.grades[col.id] == null
                                        ? ''
                                        : String(s.grades[col.id]),
                                    );
                              }
                            }}
                            animated={false}
                            style={[
                              styles.gradeCell,
                              {
                                width: COL_WIDTH,
                                backgroundColor:
                                  i % 2 === 0
                                    ? colors.surface
                                    : colors.surfaceElevated,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontFamily: FONT_FAMILY,
                                fontWeight: col.isCalculated ? '700' : '400',
                                color: col.isCalculated
                                  ? colors.primary
                                  : red
                                  ? colors.error
                                  : colors.textPrimary,
                              }}
                            >
                              {val ?? ''}
                            </Text>
                          </PressableScale>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.rowCells}>
                  {gradebook.columns.map(col => {
                    const rate = columnPassRate(gradebook.students, col);
                    return (
                      <View
                        key={col.id}
                        style={[
                          styles.gradeCell,
                          {
                            width: COL_WIDTH,
                            backgroundColor: colors.surfaceElevated,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontFamily: FONT_FAMILY,
                            fontSize: 11,
                            fontWeight: '700',
                            color:
                              rate >= 0 && rate < 50
                                ? colors.error
                                : colors.textSecondary,
                          }}
                        >
                          {rate < 0 ? '' : `${Math.round(rate)}%`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* زر عائم متعدد الأفعال */}
          {fabOpen ? (
            <Pressable
              style={styles.fabOverlay}
              onPress={() => setFabOpen(false)}
            />
          ) : null}
          <View style={styles.fabColumn}>
            {fabOpen ? (
              <>
                <FabAction
                  icon="person-add"
                  label={strings.gradebook.addStudent}
                  onPress={() => {
                    setFabOpen(false);
                    setAddMenuOpen(true);
                  }}
                />
                <FabAction
                  icon="add"
                  label={strings.gradebook.addColumn}
                  onPress={() => {
                    setFabOpen(false);
                    setColDialog({ editing: null });
                  }}
                />
              </>
            ) : null}
            <PressableScale
              onPress={() => setFabOpen(o => !o)}
              haptic
              style={[styles.fab, { backgroundColor: colors.primary }]}
            >
              <Icon
                name={fabOpen ? 'close' : 'person-add'}
                size={26}
                color="#fff"
              />
            </PressableScale>
          </View>
        </View>
      )}

      {/* إنشاء سجل مستقل؛ يمكن إنشاء أكثر من سجل للمادة والشعبة نفسها */}
      <Dialog
        visible={createGradebookOpen}
        title={strings.gradebook.newGradebook}
        onClose={() => setCreateGradebookOpen(false)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setCreateGradebookOpen(false)}
            />
            <Button
              label={strings.gradebook.createNew}
              onPress={createGradebook}
              disabled={!newGradebookTitle.trim()}
            />
          </View>
        }
      >
        {selectedSubject ? (
          <Text style={[styles.importHint, { color: colors.textSecondary }]}>
            {selectedSubject.name} - {selectedSubject.grade}
          </Text>
        ) : null}
        <TextField
          label={strings.gradebook.gradebookName}
          value={newGradebookTitle}
          onChangeText={setNewGradebookTitle}
          placeholder={strings.gradebook.gradebookNameHint}
          autoFocus
        />
        <TextField
          label={strings.gradebook.classSection}
          value={newClassName}
          onChangeText={setNewClassName}
        />
        <TextField
          label={strings.gradebook.academicYear}
          value={newAcademicYear}
          onChangeText={setNewAcademicYear}
          placeholder="2026 - 2027"
        />
      </Dialog>

      {/* حوار إضافة/تعديل عمود */}
      <ColumnDialog
        state={colDialog}
        gradebook={gradebook}
        onClose={() => setColDialog(null)}
        onSaved={updated => {
          gradebookRepo.save(updated);
          setGradebook(updated);
          setColDialog(null);
        }}
      />

      {/* إدخال سريع لدرجات عمود كامل */}
      {columnEntry && gradebook ? (
        <ColumnGradeEntryDialog
          column={columnEntry}
          gradebook={gradebook}
          students={displayStudents}
          onClose={() => setColumnEntry(null)}
          onOpenSettings={() => {
            setColumnEntry(null);
            setColDialog({ editing: columnEntry });
          }}
          onSaved={updated => {
            gradebookRepo.save(updated);
            setGradebook(updated);
            setColumnEntry(null);
          }}
        />
      ) : null}

      <Sheet
        visible={printMenuOpen}
        title={strings.gradebook.printOptions}
        onClose={() => setPrintMenuOpen(false)}
      >
        <MenuRow
          icon="print"
          label={strings.gradebook.printFilled}
          onPress={() => {
            setPrintMenuOpen(false);
            handlePrint(false);
          }}
        />
        <MenuRow
          icon="edit"
          label={strings.gradebook.printBlank}
          subtitle={strings.gradebook.printBlankHint}
          onPress={() => {
            setPrintMenuOpen(false);
            handlePrint(true);
          }}
        />
      </Sheet>

      {/* قائمة طرق إضافة الطلاب */}
      <Sheet
        visible={addMenuOpen}
        title={strings.gradebook.addStudent}
        onClose={() => setAddMenuOpen(false)}
      >
        <MenuRow
          icon="person-add"
          label={strings.gradebook.addStudentOne}
          onPress={() => {
            setAddMenuOpen(false);
            setSingleAddOpen(true);
          }}
        />
        <MenuRow
          icon="content-paste"
          label={strings.gradebook.addStudentsBulk}
          onPress={() => {
            setAddMenuOpen(false);
            setBulkOpen(true);
          }}
        />
        <MenuRow
          icon="swap-horiz"
          label={strings.gradebook.importFromGradebook}
          onPress={() => {
            setAddMenuOpen(false);
            setImportOpen(true);
          }}
        />
        <MenuRow
          icon="add-photo-alternate"
          label={strings.gradebook.aiReadNames}
          subtitle={strings.gradebook.aiReadNamesHint}
          onPress={startImageFlow}
        />
      </Sheet>

      {/* حوار الفرز */}
      <Sheet
        visible={sortMenuOpen}
        title={strings.gradebook.sort}
        onClose={() => setSortMenuOpen(false)}
      >
        {(Object.keys(SORT_LABELS) as SortMode[]).map(mode => (
          <PressableScale
            key={mode}
            onPress={() => {
              setSortMode(mode);
              setSortMenuOpen(false);
            }}
            haptic
            animated={false}
            style={styles.sortOption}
          >
            <Text
              style={[
                styles.sortOptionText,
                {
                  color:
                    sortMode === mode ? colors.primary : colors.textPrimary,
                },
              ]}
            >
              {SORT_LABELS[mode]}
            </Text>
            {sortMode === mode ? (
              <Icon name="check" size={20} color={colors.primary} />
            ) : null}
          </PressableScale>
        ))}
      </Sheet>

      {/* حوار إضافة طالب واحد */}
      <Dialog
        visible={singleAddOpen}
        title={strings.gradebook.addStudentOne}
        onClose={() => setSingleAddOpen(false)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setSingleAddOpen(false)}
            />
            <Button
              label={strings.common.add}
              onPress={addSingleStudent}
              disabled={!studentName.trim()}
            />
          </View>
        }
      >
        <TextField
          label={strings.gradebook.studentName}
          value={studentName}
          onChangeText={setStudentName}
          autoFocus
        />
      </Dialog>

      {/* حوار اللصق الجماعي */}
      <Dialog
        visible={bulkOpen}
        title={strings.gradebook.addStudentsBulk}
        onClose={() => setBulkOpen(false)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setBulkOpen(false)}
            />
            <Button
              label={strings.common.add}
              onPress={addStudentsBulk}
              disabled={!bulkText.trim()}
            />
          </View>
        }
      >
        <TextField
          label={strings.gradebook.bulkNames}
          value={bulkText}
          onChangeText={setBulkText}
          placeholder={strings.gradebook.bulkHint}
          multiline
          numberOfLines={6}
          style={styles.bulkInput}
        />
      </Dialog>

      {/* حوار الاستيراد من سجل آخر */}
      <Dialog
        visible={importOpen}
        title={strings.gradebook.importTitle}
        onClose={() => setImportOpen(false)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setImportOpen(false)}
            />
            <Button
              label={strings.common.add}
              onPress={importFromGradebook}
              disabled={!importId}
            />
          </View>
        }
      >
        <Text style={[styles.importHint, { color: colors.textSecondary }]}>
          {strings.gradebook.importHint}
        </Text>
        {importableGradebooks.length === 0 ? (
          <EmptyState
            icon={{ name: 'folder-open' }}
            title={strings.gradebook.noOtherGradebooks}
          />
        ) : (
          <SelectField
            label={strings.gradebook.importFromGradebook}
            placeholder={strings.gradebook.importTitle}
            value={importId}
            options={importableGradebooks}
            onChange={setImportId}
          />
        )}
      </Dialog>

      {/* حوار استخراج الأسماء من الصورة */}
      <Dialog
        visible={imageBusy}
        title={strings.gradebook.aiReadNames}
        onClose={() => setImageBusy(false)}
        scrollable={false}
      >
        <View style={styles.busyRow}>
          <Text style={[styles.busyText, { color: colors.textSecondary }]}>
            {strings.gradebook.extractingNames}
          </Text>
        </View>
      </Dialog>

      {/* مراجعة الأسماء المستخرجة */}
      <Dialog
        visible={reviewNames !== null}
        title={strings.gradebook.reviewNames}
        onClose={() => setReviewNames(null)}
        actions={
          <View style={styles.dialogActions}>
            <Button
              label={strings.common.cancel}
              variant="ghost"
              onPress={() => setReviewNames(null)}
            />
            <Button
              label={strings.common.add}
              onPress={confirmReviewNames}
              disabled={!reviewNames?.some(n => n.trim())}
            />
          </View>
        }
      >
        <Text style={[styles.importHint, { color: colors.textSecondary }]}>
          {strings.gradebook.reviewNamesHint}
        </Text>
        {reviewNames?.map((n, i) => (
          <View key={i} style={styles.reviewRow}>
            <PressableScale
              onPress={() => removeReviewName(i)}
              haptic
              animated={false}
              style={[
                styles.reviewRemove,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Icon name="close" size={18} color={colors.error} />
            </PressableScale>
            <TextField
              value={n}
              onChangeText={t => updateReviewName(i, t)}
              placeholder={strings.gradebook.studentName}
              style={styles.reviewInput}
            />
          </View>
        ))}
      </Dialog>

      {/* محرر درجة واحدة */}
      {gradeEdit ? (
        <Dialog
          visible
          title={`${gradeEdit.student.name} - ${gradeEdit.column.name}`}
          onClose={() => setGradeEdit(null)}
          actions={
            <View style={styles.dialogActions}>
              <Button
                label={strings.common.cancel}
                variant="ghost"
                onPress={() => setGradeEdit(null)}
              />
              <Button label={strings.common.save} onPress={saveGradeEdit} />
            </View>
          }
        >
          <TextField
            label={strings.gradebook.editGrade}
            value={gradeValue}
            onChangeText={setGradeValue}
            keyboardType="number-pad"
            autoFocus
          />
        </Dialog>
      ) : null}

      {/* محرر درجات الطالب */}
      {studentDialog && gradebook ? (
        <StudentEditor
          student={studentDialog}
          gradebook={gradebook}
          subject={selectedSubject}
          onSave={updated => {
            const idx = gradebook.students.findIndex(s => s.id === updated.id);
            const students = [...gradebook.students];
            if (idx >= 0) students[idx] = updated;
            const gb = { ...gradebook, students };
            gradebookRepo.save(gb);
            setGradebook(gb);
            setStudentDialog(null);
          }}
          onDelete={studentId => {
            const students = gradebook.students.filter(s => s.id !== studentId);
            const gb = { ...gradebook, students };
            gradebookRepo.save(gb);
            setGradebook(gb);
            setStudentDialog(null);
          }}
          onClose={() => setStudentDialog(null)}
        />
      ) : null}
    </AppScreen>
  );
}

function IconBtn({
  icon,
  onPress,
  color,
}: {
  icon: IconProps['name'];
  onPress: () => void;
  color: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic
      animated={false}
      style={[styles.iconBtn, { backgroundColor: `${color}18` }]}
    >
      <Icon name={icon} size={20} color={color} />
    </PressableScale>
  );
}

function FabAction({
  icon,
  label,
  onPress,
}: {
  icon: IconProps['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      animated={false}
      style={styles.fabAction}
    >
      <View style={[styles.fabActionChip, { backgroundColor: colors.surface }]}>
        <Text
          style={[styles.fabActionLabel, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View
          style={[styles.fabActionIcon, { backgroundColor: colors.primary }]}
        >
          <Icon name={icon} size={18} color="#fff" />
        </View>
      </View>
    </PressableScale>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: IconProps['name'];
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      animated={false}
      style={[styles.menuRow, { backgroundColor: colors.surfaceElevated }]}
    >
      <View
        style={[
          styles.menuIconWrap,
          { backgroundColor: `${colors.primary}15` },
        ]}
      >
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-left" size={22} color={colors.textSecondary} />
    </PressableScale>
  );
}

/* ------------------------------- حوار العمود ------------------------------- */

interface ColumnDialogProps {
  state: { editing: GradeColumn | null } | null;
  gradebook: GradeBook | null;
  onClose: () => void;
  onSaved: (gb: GradeBook) => void;
}

function ColumnDialog({
  state,
  gradebook,
  onClose,
  onSaved,
}: ColumnDialogProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [isCalculated, setIsCalculated] = useState(false);
  const [calcType, setCalcType] = useState<'AVG' | 'SUM'>('AVG');
  const [included, setIncluded] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!state) return;
    setName(state.editing?.name ?? '');
    setMaxScore(String(state.editing?.maxScore ?? 100));
    setIsCalculated(state.editing?.isCalculated ?? false);
    setCalcType(state.editing?.calculationType ?? 'AVG');
    const map: Record<string, boolean> = {};
    for (const id of state.editing?.includedColumnIds ?? []) map[id] = true;
    setIncluded(map);
  }, [state]);

  if (!state || !gradebook) return null;

  const otherColumns = gradebook.columns.filter(
    c => c.id !== state.editing?.id,
  );

  const save = () => {
    if (!name.trim()) return;
    const editing = state.editing;
    if (editing) {
      const columns = gradebook.columns.map(c =>
        c.id === editing.id
          ? {
              ...c,
              name: name.trim(),
              maxScore: Number(maxScore) || 100,
              isCalculated,
              calculationType: calcType,
              includedColumnIds: otherColumns
                .filter(c => included[c.id])
                .map(c => c.id),
            }
          : c,
      );
      onSaved({ ...gradebook, columns });
    } else {
      const col: GradeColumn = {
        id: newId(),
        name: name.trim(),
        maxScore: Number(maxScore) || 100,
        weight: 10,
        isCalculated,
        includedColumnIds: otherColumns
          .filter(c => included[c.id])
          .map(c => c.id),
        calculationType: calcType,
      };
      onSaved({ ...gradebook, columns: [...gradebook.columns, col] });
    }
  };

  const removeColumn = () => {
    const editing = state.editing;
    if (!editing) return;
    const columns = gradebook.columns.filter(c => c.id !== editing.id);
    const students = gradebook.students.map(s => {
      const grades = { ...s.grades };
      delete grades[editing.id];
      return { ...s, grades };
    });
    onSaved({ ...gradebook, columns, students });
  };

  return (
    <Dialog
      visible
      title={
        state.editing
          ? strings.gradebook.editColumn
          : strings.gradebook.addColumnTitle
      }
      onClose={onClose}
      actions={
        <View style={styles.dialogActions}>
          {state.editing ? (
            <Button
              label={strings.common.delete}
              variant="danger"
              onPress={removeColumn}
            />
          ) : null}
          <Button
            label={strings.common.cancel}
            variant="ghost"
            onPress={onClose}
          />
          <Button
            label={strings.common.save}
            onPress={save}
            disabled={!name.trim()}
          />
        </View>
      }
    >
      <TextField
        label={strings.gradebook.columnName}
        value={name}
        onChangeText={setName}
        placeholder={strings.gradebook.columnHint}
      />
      {!isCalculated ? (
        <TextField
          label={strings.gradebook.maxScore}
          value={maxScore}
          onChangeText={setMaxScore}
          keyboardType="number-pad"
        />
      ) : (
        <SelectField
          label={strings.gradebook.calcType}
          value={calcType}
          options={[
            { label: strings.gradebook.avg, value: 'AVG' },
            { label: strings.gradebook.sum, value: 'SUM' },
          ]}
          onChange={setCalcType}
        />
      )}

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
          {strings.gradebook.isCalculated}
        </Text>
        <Switch
          value={isCalculated}
          onValueChange={setIsCalculated}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {isCalculated ? (
        <View style={{ marginTop: 8 }}>
          <Text
            style={[
              styles.switchLabel,
              { color: colors.textSecondary, marginBottom: 8 },
            ]}
          >
            {strings.gradebook.includedColumns}
          </Text>
          {otherColumns.map(c => (
            <PressableScale
              key={c.id}
              onPress={() =>
                setIncluded(prev => ({ ...prev, [c.id]: !prev[c.id] }))
              }
              animated={false}
              style={styles.checkRow}
            >
              <Icon
                name={included[c.id] ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={colors.primary}
              />
              <Text
                style={{ fontFamily: FONT_FAMILY, color: colors.textPrimary }}
              >
                {c.name}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </Dialog>
  );
}

/* --------------------------- إدخال عمود كامل --------------------------- */

interface ColumnGradeEntryDialogProps {
  column: GradeColumn;
  gradebook: GradeBook;
  students: Student[];
  onClose: () => void;
  onOpenSettings: () => void;
  onSaved: (gradebook: GradeBook) => void;
}

function ColumnGradeEntryDialog({
  column,
  gradebook,
  students,
  onClose,
  onOpenSettings,
  onSaved,
}: ColumnGradeEntryDialogProps) {
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const inputRefs = useRef<Array<React.ElementRef<typeof TextInput> | null>>(
    [],
  );

  React.useEffect(() => {
    const initial: Record<string, string> = {};
    for (const student of students) {
      const score = student.grades[column.id];
      initial[student.id] = score == null ? '' : String(score);
    }
    inputRefs.current = [];
    setValues(initial);
  }, [column.id, gradebook.id, students]);

  const save = () => {
    const nextValues: Record<string, number | null> = {};
    for (const student of students) {
      const raw = (values[student.id] ?? '').trim();
      if (raw === '') {
        nextValues[student.id] = null;
        continue;
      }
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0 || value > column.maxScore) {
        showError(
          strings.gradebook.gradeInvalid.replace(
            '{max}',
            String(column.maxScore),
          ),
        );
        return;
      }
      nextValues[student.id] = value;
    }

    const nextStudents = gradebook.students.map(student => {
      const grades = { ...student.grades };
      const value = nextValues[student.id];
      if (value == null) delete grades[column.id];
      else grades[column.id] = value;
      return { ...student, grades };
    });
    onSaved({ ...gradebook, students: nextStudents });
  };

  return (
    <Dialog
      visible
      title={strings.gradebook.columnEntry.replace('{column}', column.name)}
      onClose={onClose}
      actions={
        <View style={styles.dialogActions}>
          <Button
            label={strings.gradebook.columnSettings}
            variant="ghost"
            onPress={onOpenSettings}
          />
          <Button
            label={strings.common.cancel}
            variant="ghost"
            onPress={onClose}
          />
          <Button label={strings.gradebook.saveColumnGrades} onPress={save} />
        </View>
      }
    >
      <Text style={[styles.columnEntryHint, { color: colors.textSecondary }]}>
        {strings.gradebook.columnEntryHint} ({strings.gradebook.maxScore}:{' '}
        {column.maxScore})
      </Text>
      {students.map((student, index) => (
        <View
          key={student.id}
          style={[styles.columnEntryRow, { borderBottomColor: colors.divider }]}
        >
          <Text
            style={[styles.columnEntryName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {index + 1}. {student.name}
          </Text>
          <TextInput
            ref={input => {
              inputRefs.current[index] = input;
            }}
            value={values[student.id] ?? ''}
            onChangeText={value =>
              setValues(previous => ({ ...previous, [student.id]: value }))
            }
            keyboardType="number-pad"
            returnKeyType={index === students.length - 1 ? 'done' : 'next'}
            onSubmitEditing={() => inputRefs.current[index + 1]?.focus()}
            autoFocus={index === 0}
            selectTextOnFocus
            style={[
              styles.columnEntryInput,
              {
                color: colors.textPrimary,
                borderColor: colors.divider,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
          />
        </View>
      ))}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700' },
  savedCardWrap: { paddingHorizontal: 8, marginVertical: 4 },
  savedCard: {
    borderRadius: radius.md,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  savedTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700' },
  savedMeta: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 2 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBarTitle: { flex: 1, minWidth: 0 },
  headerBarTitleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  headerBarSubtitle: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaStats: { fontFamily: FONT_FAMILY, fontSize: 12, flex: 1 },
  metaBold: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700' },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sortPillText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700' },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  sortOptionText: { fontFamily: FONT_FAMILY, fontSize: 15 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuRowText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600' },
  menuRowSubtitle: { fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 2 },
  bulkInput: { minHeight: 120, textAlignVertical: 'top' },
  importHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  busyText: { fontFamily: FONT_FAMILY, fontSize: 14 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewRemove: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInput: { flex: 1 },
  columnEntryHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 8,
  },
  columnEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    borderBottomWidth: 1,
  },
  columnEntryName: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 14 },
  columnEntryInput: {
    width: 82,
    height: 38,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    textAlign: 'center',
  },
  nameFooterCell: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableWrap: { flex: 1, flexDirection: 'row', marginHorizontal: 8 },
  gradesPane: { flex: 1 },
  nameHeaderCell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: radius.sm,
    borderBottomLeftRadius: 0,
    paddingHorizontal: 4,
  },
  headerText: {
    color: '#fff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSmall: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    textAlign: 'center',
  },
  nameCell: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  nameText: { fontFamily: FONT_FAMILY, fontSize: 13 },
  columnHeaderRow: { flexDirection: 'row' },
  colHeaderCell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  rowCells: { flexDirection: 'row' },
  gradeCell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabColumn: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    alignItems: 'flex-start',
  },
  fabOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fabAction: { marginBottom: 10 },
  fabActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabActionLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  fabActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogActions: { flexDirection: 'row', gap: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchLabel: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
});
