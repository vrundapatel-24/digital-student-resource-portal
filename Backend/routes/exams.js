const express = require("express");
const db = require("../database");

const router = express.Router();

// GET /api/exams
router.get("/", (req, res) => {
  db.all(
    `
    SELECT
      id,
      title,
      subject,
      exam_date,
      reminder_enabled,
      created_at,
      updated_at
    FROM exams
    ORDER BY exam_date ASC, id DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching exams:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to fetch exams."
        });
      }

      res.json({
        success: true,
        count: rows.length,
        exams: rows
      });
    }
  );
});


// POST /api/exams
router.post("/", (req, res) => {
  const {
    title,
    subject = "",
    exam_date,
    reminder_enabled = false
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({
      success: false,
      message: "Exam title is required."
    });
  }

  if (!exam_date || !String(exam_date).trim()) {
    return res.status(400).json({
      success: false,
      message: "Exam date is required."
    });
  }

  const cleanTitle = String(title).trim();
  const cleanSubject = subject ? String(subject).trim() : "";
  const cleanExamDate = String(exam_date).trim();
  const reminderValue = reminder_enabled ? 1 : 0;

  db.run(
    `
    INSERT INTO exams
    (
      title,
      subject,
      exam_date,
      reminder_enabled
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      cleanTitle,
      cleanSubject,
      cleanExamDate,
      reminderValue
    ],
    function (err) {
      if (err) {
        console.error("Error adding exam:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to add exam."
        });
      }

      const examId = this.lastID;

      db.get(
        `
        SELECT
          id,
          title,
          subject,
          exam_date,
          reminder_enabled,
          created_at,
          updated_at
        FROM exams
        WHERE id = ?
        `,
        [examId],
        (selectErr, exam) => {
          if (selectErr) {
            console.error(
              "Error getting newly created exam:",
              selectErr.message
            );

            return res.status(500).json({
              success: false,
              message: "Exam was added but could not be returned."
            });
          }

          res.status(201).json({
            success: true,
            message: "Exam added successfully.",
            exam
          });
        }
      );
    }
  );
});

// ==========================================
// UPDATE EXAM
// PUT /api/exams/:id
// ==========================================

router.put("/:id", (req, res) => {

  const examId = Number(req.params.id);

  const {
    title,
    subject = "",
    exam_date,
    reminder_enabled = false
  } = req.body;

  // Validate ID
  if (!Number.isInteger(examId) || examId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID."
    });
  }

  // Validate title
  if (!title || !String(title).trim()) {
    return res.status(400).json({
      success: false,
      message: "Exam title is required."
    });
  }

  // Validate date
  if (!exam_date || !String(exam_date).trim()) {
    return res.status(400).json({
      success: false,
      message: "Exam date is required."
    });
  }

  const cleanTitle =
    String(title).trim();

  const cleanSubject =
    subject
      ? String(subject).trim()
      : "";

  const cleanExamDate =
    String(exam_date).trim();

  const reminderValue =
    reminder_enabled ? 1 : 0;

  db.run(
    `
    UPDATE exams
    SET
      title = ?,
      subject = ?,
      exam_date = ?,
      reminder_enabled = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      cleanTitle,
      cleanSubject,
      cleanExamDate,
      reminderValue,
      examId
    ],
    function (err) {

      if (err) {
        console.error(
          "Error updating exam:",
          err.message
        );

        return res.status(500).json({
          success: false,
          message: "Failed to update exam."
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Exam not found."
        });
      }

      db.get(
        `
        SELECT
          id,
          title,
          subject,
          exam_date,
          reminder_enabled,
          created_at,
          updated_at
        FROM exams
        WHERE id = ?
        `,
        [examId],
        (selectErr, exam) => {

          if (selectErr) {
            console.error(
              "Error getting updated exam:",
              selectErr.message
            );

            return res.status(500).json({
              success: false,
              message:
                "Exam updated but could not be returned."
            });
          }

          res.json({
            success: true,
            message:
              "Exam updated successfully.",
            exam
          });

        }
      );

    }
  );

});

// DELETE /api/exams/:id
router.delete("/:id", (req, res) => {

  const examId = Number(req.params.id);

  if (!Number.isInteger(examId) || examId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID."
    });
  }

  db.run(
    "DELETE FROM exams WHERE id = ?",
    [examId],
    function (err) {

      if (err) {
        console.error("Error deleting exam:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to delete exam."
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Exam not found."
        });
      }

      res.json({
        success: true,
        message: "Exam deleted successfully.",
        deletedId: examId
      });

    }
  );

});

module.exports = router;
