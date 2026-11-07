export const CAMPUS_RECORD_TASKS = [
  { id: 'who', label: '谁', question: '谁在录制？', clue: '人物', content: '小明' },
  { id: 'why', label: '为什么', question: '为什么录制？', clue: '目的', content: '制作讲解短片' },
  { id: 'where', label: '在哪里', question: '在哪里录制？', clue: '地点', content: '学校体育馆' },
  { id: 'what', label: '什么内容', question: '录下了什么？', clue: '内容', content: '白衣队传球' },
] as const;

export type CampusRecordTask = (typeof CAMPUS_RECORD_TASKS)[number]['id'];
export const CAMPUS_RECORD_TEXT = '小明为了制作讲解短片，在学校体育馆录下了白衣队传球。';