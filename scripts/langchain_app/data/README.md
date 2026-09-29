# Short-answer question bank

`short_answer_questions.json` contains the registered short-answer grading tasks. New questions
can also be sent inline without adding an entry.
Each item accepts exactly these fields:

- `id`: Stable unique task ID used by `/short-answer/evaluate`.
- `question`: The learner-facing question.
- `answer`: A non-empty array of core reference-answer points.
- `notes`: Optional grading nuance; use `null` when no note is needed.

The service reads and validates the file on every request, so question-bank edits do not require
a service restart. All tasks share the same three grades and system prompt in
`tasks/short_answer.py`.

New questions can be evaluated directly without registering or manually naming an ID:

```json
{
  "question": "The learner-facing question",
  "reference_answer": "The expected answer, or an array of core points",
  "answer": "The learner answer"
}
```

The service derives a stable SHA-256 identity from the question and reference points. The old
question-bank form remains available for existing tasks:

```json
{
  "task_id": "your.unique_task_id",
  "answer": "The learner answer"
}
```

Legacy module URLs are compatibility aliases in `registry.py`; each alias binds a task ID to the
same `evaluate_short_answer` function.
