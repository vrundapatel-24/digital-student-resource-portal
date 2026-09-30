const express = require("express");
const db = require("../database");

const router = express.Router();

// ==========================================
// GET ALL STUDY TASKS
// GET /api/study/tasks
// ==========================================

router.get("/tasks", (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      description,
      date,
      time,
      completed,
      completed_at,
      created_at,
      updated_at
    FROM study_tasks
    ORDER BY
      CASE WHEN date IS NULL OR date = '' THEN 1 ELSE 0 END,
      date ASC,
      time ASC,
      id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching study tasks:", err.message);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch study tasks."
      });
    }

    res.json({
      success: true,
      count: rows.length,
      tasks: rows
    });
  });
});


// ==========================================
// ADD NEW STUDY TASK
// POST /api/study/tasks
// ==========================================

router.post("/tasks", (req, res) => {
  const {
    title,
    description = "",
    date = null,
    time = null
  } = req.body;

  // Validate title
  if (!title || !String(title).trim()) {
    return res.status(400).json({
      success: false,
      message: "Task title is required."
    });
  }

  const cleanTitle = String(title).trim();
  const cleanDescription = description
    ? String(description).trim()
    : "";

  const cleanDate = date || null;
  const cleanTime = time || null;

  const sql = `
    INSERT INTO study_tasks
    (
      title,
      description,
      date,
      time,
      completed
    )
    VALUES (?, ?, ?, ?, 0)
  `;

  db.run(
    sql,
    [
      cleanTitle,
      cleanDescription,
      cleanDate,
      cleanTime
    ],
    function (err) {
      if (err) {
        console.error("Error adding study task:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to add study task."
        });
      }

      const taskId = this.lastID;

      db.get(
        `
        SELECT
          id,
          title,
          description,
          date,
          time,
          completed,
          completed_at,
          created_at,
          updated_at
        FROM study_tasks
        WHERE id = ?
        `,
        [taskId],
        (selectErr, task) => {
          if (selectErr) {
            console.error(
              "Error getting newly created task:",
              selectErr.message
            );

            return res.status(500).json({
              success: false,
              message: "Task was added but could not be returned."
            });
          }

          res.status(201).json({
            success: true,
            message: "Study task added successfully.",
            task
          });
        }
      );
    }
  );
});


// ==========================================
// MARK TASK COMPLETED / INCOMPLETE
// PATCH /api/study/tasks/:id/completed
// ==========================================

router.patch("/tasks/:id/completed", (req, res) => {
  const taskId = Number(req.params.id);
  const { completed } = req.body;

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID."
    });
  }

  const completedValue = completed ? 1 : 0;

  const completedAt = completedValue
    ? new Date().toISOString()
    : null;

  db.run(
    `
    UPDATE study_tasks
    SET
      completed = ?,
      completed_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      completedValue,
      completedAt,
      taskId
    ],
    function (err) {
      if (err) {
        console.error(
          "Error updating study task:",
          err.message
        );

        return res.status(500).json({
          success: false,
          message: "Failed to update study task."
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Study task not found."
        });
      }

      db.get(
        `
        SELECT
          id,
          title,
          description,
          date,
          time,
          completed,
          completed_at,
          created_at,
          updated_at
        FROM study_tasks
        WHERE id = ?
        `,
        [taskId],
        (selectErr, task) => {
          if (selectErr) {
            return res.status(500).json({
              success: false,
              message: "Task updated but could not be returned."
            });
          }

          res.json({
            success: true,
            message: completedValue
              ? "Task marked as completed."
              : "Task marked as incomplete.",
            task
          });
        }
      );
    }
  );
});


// ==========================================
// DELETE STUDY TASK
// DELETE /api/study/tasks/:id
// ==========================================

router.delete("/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task ID."
    });
  }

  db.run(
    `
    DELETE FROM study_tasks
    WHERE id = ?
    `,
    [taskId],
    function (err) {
      if (err) {
        console.error(
          "Error deleting study task:",
          err.message
        );

        return res.status(500).json({
          success: false,
          message: "Failed to delete study task."
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Study task not found."
        });
      }

      res.json({
        success: true,
        message: "Study task deleted successfully."
      });
    }
  );
});
// ==========================================
// GET STUDY STREAK
// GET /api/study/streak
// ==========================================

router.get("/streak", (req, res) => {

  db.get(
    `
    SELECT COUNT(*) AS streak
    FROM study_tasks
    WHERE completed = 1
    `,
    [],
    (err, row) => {

      if (err) {
        console.error(
          "Error calculating study streak:",
          err.message
        );

        return res.status(500).json({
          success: false,
          message: "Failed to calculate study streak."
        });
      }

      const streak = Number(row?.streak || 0);

      res.json({
        success: true,
        streak
      });

    }
  );

});
// GET /api/study/progress
router.get("/progress", (req, res) => {

  db.get(
    `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed
    FROM study_tasks
    `,
    [],
    (err, row) => {

      if (err) {
        console.error("Error calculating study progress:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to calculate study progress."
        });
      }

      const total = Number(row?.total || 0);
      const completed = Number(row?.completed || 0);

      const progress =
        total > 0
          ? Math.round((completed / total) * 100)
          : 0;

      res.json({
        success: true,
        progress,
        completed,
        total
      });

    }
  );

});
module.exports = router;