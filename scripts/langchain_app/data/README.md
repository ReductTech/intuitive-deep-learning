# Short-answer question bank

`short_answer_questions.json` is the single source of truth for short-answer grading tasks.
Each item accepts exactly these fields:

- `id`: Stable unique task ID used by `/short-answer/evaluate`.
- `question`: The learner-facing question.
- `answer`: A non-empty array of core reference-answer points.
- `notes`: Optional grading nuance; use `null` when no note is needed.

The service reads and validates the file on every request, so question-bank edits do not require
a service restart. All tasks share the same three grades and system prompt in
`tasks/short_answer.py`.

Use the generic endpoint for new questions:

```json
{
  "task_id": "your.unique_task_id",
  "answer": "The learner answer"
}
```

Legacy module URLs are compatibility aliases in `registry.py`; each alias binds a task ID to the
same `evaluate_short_answer` function.
