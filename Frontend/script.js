"use strict";

/* =====================================================
   CONFIGURATION
===================================================== */

const API_BASE = "http://localhost:5000/api";


/* =====================================================
   GLOBAL STATE
===================================================== */

const state = {
    currentPage: "dashboard",

    courses: [],
    resources: [],
    notes: [],
    practicals: [],
    tasks: [],
    exams: [],

    progress: null,
    streak: null,

    settings: {
        theme: "light",
        fontSize: "medium",
        studyNotifications: true,
        examNotifications: true,
        reducedMotion: false
    }
};


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener("DOMContentLoaded", initializeApplication);


/* =====================================================
   MAIN INITIALIZATION
===================================================== */

function initializeApplication() {

    loadSettings();

    initializeLandingPage();

    initializeNavigation();

    initializeSearch();

    initializeStudyCenter();

    initializeExamControls();

    initializeSettings();

    initializeMobileSidebar();

    initializeRefreshButtons();

    applySettings();

    updateLandingPreview();

}


/* =====================================================
   LANDING PAGE
===================================================== */

function initializeLandingPage() {

    const startButtons = [
        document.getElementById("startLearningBtn"),
        document.getElementById("startLearningTopBtn"),
        document.getElementById("exploreStartBtn")
    ];

    startButtons.forEach(button => {

        if (!button) return;

        button.addEventListener("click", openDashboard);

    });


    const exploreButtons = [
        document.getElementById("explorePortalBtn"),
        document.getElementById("exploreLandingBtn")
    ];

    exploreButtons.forEach(button => {

        if (!button) return;

        button.addEventListener("click", scrollToExplore);

    });


    const homeLandingBtn =
        document.getElementById("homeLandingBtn");

    if (homeLandingBtn) {

        homeLandingBtn.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    }


    const backButton =
        document.getElementById("backToLandingBtn");

    if (backButton) {

        backButton.addEventListener(
            "click",
            showLandingPage
        );

    }

}


/* =====================================================
   OPEN DASHBOARD
===================================================== */

function openDashboard() {

    document
        .getElementById("landingPage")
        .classList.add("hidden");

    document
        .getElementById("appPage")
        .classList.remove("hidden");

    showAppPage("dashboard");

    loadDashboardData();

}


/* =====================================================
   SHOW LANDING PAGE
===================================================== */

function showLandingPage() {

    document
        .getElementById("appPage")
        .classList.add("hidden");

    document
        .getElementById("landingPage")
        .classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =====================================================
   EXPLORE
===================================================== */

function scrollToExplore() {

    const section =
        document.getElementById("explorePortalSection");

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =====================================================
   NAVIGATION
===================================================== */

function initializeNavigation() {

    document
        .querySelectorAll(".sidebar-link")
        .forEach(button => {

            button.addEventListener("click", () => {

                const page =
                    button.dataset.page;

                showAppPage(page);

                closeMobileSidebar();

            });

        });


    document
        .querySelectorAll("[data-page-link]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const page =
                    button.dataset.pageLink;

                showAppPage(page);

            });

        });

}


/* =====================================================
   SHOW APP PAGE
===================================================== */

async function showAppPage(page) {

    const validPages = [
        "dashboard",
        "courses",
        "notes",
        "resources",
        "study",
        "practical",
        "settings",
        "search"
    ];

    if (!validPages.includes(page)) {
        page = "dashboard";
    }

    state.currentPage = page;


    document
        .querySelectorAll(".app-page")
        .forEach(section => {

            section.classList.remove("active-page");

        });


    const target =
        document.getElementById(`page-${page}`);

    if (target) {
        target.classList.add("active-page");
    }


    document
        .querySelectorAll(".sidebar-link")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    switch (page) {

        case "dashboard":
            await loadDashboardData();
            break;

        case "courses":
            await loadCourses();
            break;

        case "notes":
            await loadNotes();
            break;

        case "resources":
            await loadResources();
            break;

        case "study":
            await loadStudyCenter();
            break;

        case "practical":
            await loadPracticals();
            break;

        case "settings":
            loadSettingsIntoUI();
            break;

        case "search":
            break;

    }

}


/* =====================================================
   API HELPER
===================================================== */

async function apiRequest(
    endpoint,
    options = {}
) {

    try {

        const response =
            await fetch(`${API_BASE}${endpoint}`, {
                ...options,

                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            });


        let data = null;

        const contentType =
            response.headers.get("content-type") || "";


        if (contentType.includes("application/json")) {

            data = await response.json();

        } else {

            data = await response.text();

        }


        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                `Request failed (${response.status})`;

            throw new Error(message);

        }


        return data;

    } catch (error) {

        console.error(
            `API error: ${endpoint}`,
            error
        );

        throw error;

    }

}


/* =====================================================
   HEALTH CHECK
===================================================== */

async function checkServerHealth() {

    try {

        await apiRequest("/health");

        return true;

    } catch (error) {

        showToast(
            "Server unavailable. Please make sure the backend is running.",
            "error"
        );

        return false;

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboardData() {

    const serverOnline =
        await checkServerHealth();

    if (!serverOnline) return;


    try {

        const [
            coursesResponse,
            resourcesResponse,
            tasksResponse,
            progressResponse,
            streakResponse,
            examsResponse
        ] = await Promise.allSettled([

            apiRequest("/courses"),
            apiRequest("/resources"),
            apiRequest("/study/tasks"),
            apiRequest("/study/progress"),
            apiRequest("/study/streak"),
            apiRequest("/exams")

        ]);


        state.courses =
            extractArray(coursesResponse);

        state.resources =
            extractArray(resourcesResponse);

        state.tasks =
            extractArray(tasksResponse);

        state.progress =
            extractObject(progressResponse);

        state.streak =
            extractObject(streakResponse);

        state.exams =
            extractArray(examsResponse);


        updateDashboardUI();

        updateLandingPreview();

    } catch (error) {

        showToast(
            "Failed to load dashboard data.",
            "error"
        );

    }

}


/* =====================================================
   EXTRACT API DATA
===================================================== */

function extractArray(result) {

    if (!result) return [];

    if (result.status === "fulfilled") {

        const value = result.value;

        if (Array.isArray(value)) {
            return value;
        }

        if (Array.isArray(value?.data)) {
            return value.data;
        }

        if (Array.isArray(value?.exams)) {
            return value.exams;
        }
        if (Array.isArray(value?.tasks)) {
             return value.tasks;
        }

        if (Array.isArray(value?.items)) {
            return value.items;
        }

        if (Array.isArray(value?.results)) {
            return value.results;
        }

    }

    return [];

}


function extractObject(result) {

    if (!result) return null;

    if (result.status === "fulfilled") {

        const value = result.value;

        if (value?.data && !Array.isArray(value.data)) {
            return value.data;
        }

        return value;

    }

    return null;

}
/* =====================================================
   DASHBOARD UI
===================================================== */

function updateDashboardUI() {

    const completedTasks =
        state.tasks.filter(
            task => isTaskCompleted(task)
        ).length;


    const totalTasks =
        state.tasks.length;


    const progress =
        calculateProgress(
            completedTasks,
            totalTasks
        );


    const upcomingExams =
        getUpcomingExams(state.exams);


    setText(
        "dashboardCoursesCount",
        state.courses.length
    );

    setText(
        "dashboardResourcesCount",
        state.resources.length
    );

    setText(
        "dashboardCompletedTasks",
        completedTasks
    );

    setText(
        "dashboardUpcomingExams",
        upcomingExams.length
    );


    setText(
        "dashboardProgressText",
        `${progress}%`
    );


    setWidth(
        "dashboardProgressBar",
        progress
    );


    setText(
        "dashboardProgressCompleted",
        `${completedTasks} completed`
    );


    setText(
        "dashboardProgressTotal",
        `${totalTasks} total`
    );


    const streak =
        getStreakValue(state.streak);

    setText(
        "dashboardStreak",
        streak
    );


    renderDashboardTasks();

    renderDashboardExams();

}


/* =====================================================
   PROGRESS CALCULATION
===================================================== */

function calculateProgress(
    completed,
    total
) {

    if (!total || total <= 0) {
        return 0;
    }

    return Math.round(
        (completed / total) * 100
    );

}


/* =====================================================
   TASK COMPLETION
===================================================== */

function isTaskCompleted(task) {

    return (
        task.completed === true ||
        task.completed === 1 ||
        task.completed === "1" ||
        task.is_completed === true ||
        task.is_completed === 1
    );

}


/* =====================================================
   STREAK
===================================================== */

function getStreakValue(streak) {

    if (!streak) {
        return 0;
    }

    return Number(
        streak.streak ??
        streak.current_streak ??
        streak.days ??
        0
    ) || 0;

}


/* =====================================================
   DASHBOARD TASKS
===================================================== */

function renderDashboardTasks() {

    const container =
        document.getElementById(
            "dashboardTasksList"
        );

    if (!container) return;


    if (!state.tasks.length) {

        container.innerHTML = emptyStateHTML(
            "✓",
            "No study tasks yet.",
            "Add a task from My Study Center."
        );

        return;

    }


    const latestTasks =
        [...state.tasks]
            .sort(
                (a, b) =>
                    Number(b.id || 0) -
                    Number(a.id || 0)
            )
            .slice(0, 5);


    container.innerHTML =
        latestTasks.map(task => `

            <div class="mini-list-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            task.title ||
                            task.task ||
                            task.name ||
                            "Study Task"
                        )}
                    </strong>

                    <span>
                        ${
                            isTaskCompleted(task)
                                ? "Completed"
                                : "Pending"
                        }
                    </span>

                </div>

                <span>
                    ${
                        isTaskCompleted(task)
                            ? "✓"
                            : "•"
                    }
                </span>

            </div>

        `).join("");

}


/* =====================================================
   DASHBOARD EXAMS
===================================================== */

function renderDashboardExams() {

    const container =
        document.getElementById(
            "dashboardExamsList"
        );

    if (!container) return;


    const exams =
        getUpcomingExams(state.exams)
            .slice(0, 4);


    if (!exams.length) {

        container.innerHTML = emptyStateHTML(
            "📅",
            "No exam data available yet.",
            "Add exam information in Study Center."
        );

        return;

    }


    container.innerHTML =
        exams.map(exam => `

            <div class="mini-list-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            exam.title ||
                            "Exam"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            exam.subject ||
                            "Subject not specified"
                        )}
                    </span>

                </div>

                <span>
                    ${formatDate(
                        exam.exam_date
                    )}
                </span>

            </div>

        `).join("");

}


/* =====================================================
   COURSES
===================================================== */

async function loadCourses() {

    const container =
        document.getElementById(
            "coursesContainer"
        );

    if (!container) return;


    container.innerHTML =
        loadingHTML(
            "Loading courses..."
        );


    try {

        const response =
            await apiRequest(
                "/courses"
            );


        state.courses =
            Array.isArray(
                response?.courses
            )
                ? response.courses
                : [];


        state.courseFiles =
            Array.isArray(
                response?.files
            )
                ? response.files
                : [];


        renderCourses();


    } catch (error) {

        console.error(
            "Courses loading error:",
            error
        );


        container.innerHTML =
            errorStateHTML(
                "Failed to load courses.",
                "Please check that the backend is running."
            );


        showToast(
            "Failed to load courses.",
            "error"
        );

    }

}


/* =====================================================
   RENDER COURSES
===================================================== */

function renderCourses() {

    const container =
        document.getElementById(
            "coursesContainer"
        );


    if (!container) return;


    if (
        !Array.isArray(
            state.courses
        ) ||
        state.courses.length === 0
    ) {

        container.innerHTML =
            emptyStateHTML(
                "📚",
                "No courses available yet.",
                "Available courses will appear here."
            );

        return;

    }


    container.innerHTML = `

        <div class="course-list-grid">

            ${state.courses
                .map(course => {

                    const name =
                        course.name ||
                        "Course";


                    const fileCount =
                        (state.courseFiles || [])
                            .filter(
                                file =>
                                    file.course === name
                            )
                            .length;


                    return `

                        <article
                            class="course-main-card"
                        >

                            <div
                                class="course-card-icon"
                            >
                                📚
                            </div>


                            <div
                                class="course-card-content"
                            >

                                <span
                                    class="section-label"
                                >
                                    COURSE
                                </span>


                                <h2>
                                    ${escapeHTML(name)}
                                </h2>


                                <p>
                                    Explore learning files
                                    and study materials.
                                </p>


                                <div
                                    class="course-card-meta"
                                >

                                    <span>
                                        📄
                                        ${fileCount}
                                        ${
                                            fileCount === 1
                                                ? "file"
                                                : "files"
                                        }
                                    </span>

                                </div>


                                <button
                                    class="course-open-button"
                                    onclick="
                                        openCourse(
                                            '${escapeJS(name)}'
                                        )
                                    "
                                >
                                    Open Course
                                    <span>→</span>
                                </button>

                            </div>

                        </article>

                    `;

                })
                .join("")}

        </div>

    `;

}


/* =====================================================
   COURSE FILE PREVIEW
===================================================== */

async function viewCourseFile(
    key,
    fileName
) {

    if (!key) {

        showToast(
            "File information is missing.",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/courses/file-url?key=${encodeURIComponent(key)}&mode=view`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.url
        ) {

            throw new Error(
                "Preview URL unavailable."
            );

        }


        const extension =
            getFileExtension(
                fileName
            ).toLowerCase();


        /*
         * PDF can be displayed directly
         * inside the browser.
         */

        if (extension === "pdf") {

            openCoursePreviewModal(
                fileName,
                data.url,
                "pdf"
            );

            return;

        }


        /*
         * DOCX preview.
         *
         * Microsoft Office Viewer is used
         * for browser preview.
         */

        if (
            extension === "docx" ||
            extension === "doc"
        ) {

            const officeViewer =
                "https://view.officeapps.live.com/op/view.aspx?src=" +
                encodeURIComponent(
                    data.url
                );


            openCoursePreviewModal(
                fileName,
                officeViewer,
                "office"
            );

            return;

        }


        window.open(
            data.url,
            "_blank",
            "noopener,noreferrer"
        );


    } catch (error) {

        console.error(
            "Course preview error:",
            error
        );


        showToast(
            "Unable to preview this file.",
            "error"
        );

    }

}


/* =====================================================
   COURSE FILE DOWNLOAD
===================================================== */

async function downloadCourseFile(
    key
) {

    if (!key) {

        showToast(
            "File information is missing.",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/courses/file-url?key=${encodeURIComponent(key)}&mode=download`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.url
        ) {

            throw new Error(
                "Download URL unavailable."
            );

        }


        const link =
            document.createElement(
                "a"
            );


        link.href =
            data.url;


        link.target =
            "_blank";


        link.rel =
            "noopener,noreferrer";


        link.click();


    } catch (error) {

        console.error(
            "Course download error:",
            error
        );


        showToast(
            "Unable to download this file.",
            "error"
        );

    }

}


/* =====================================================
   COURSE PREVIEW MODAL
===================================================== */

function openCoursePreviewModal(
    fileName,
    url,
    type
) {

    const existing =
        document.getElementById(
            "coursePreviewModal"
        );


    if (existing) {
        existing.remove();
    }


    const content =
        type === "pdf"

            ? `
                <iframe
                    src="${escapeHTML(url)}"
                    title="${escapeHTML(fileName)}"
                    style="
                        width:100%;
                        height:70vh;
                        border:0;
                        border-radius:12px;
                        background:#fff;
                    "
                ></iframe>
            `

            : `
                <iframe
                    src="${escapeHTML(url)}"
                    title="${escapeHTML(fileName)}"
                    style="
                        width:100%;
                        height:70vh;
                        border:0;
                        border-radius:12px;
                        background:#fff;
                    "
                ></iframe>
            `;


    document.body.insertAdjacentHTML(
        "beforeend",
        `

        <div
            id="coursePreviewModal"
            class="course-preview-overlay"
            onclick="
                if(event.target === this)
                    closeCoursePreview()
            "
        >

            <div
                class="course-preview-modal"
            >

                <div
                    class="course-preview-header"
                >

                    <div>

                        <span
                            class="section-label"
                        >
                            FILE PREVIEW
                        </span>


                        <h2>
                            ${escapeHTML(fileName)}
                        </h2>

                    </div>


                    <button
                        class="course-preview-close"
                        onclick="
                            closeCoursePreview()
                        "
                    >
                        ×
                    </button>

                </div>


                <div
                    class="course-preview-body"
                >

                    ${content}

                </div>

            </div>

        </div>

        `
    );

}


/* =====================================================
   CLOSE COURSE PREVIEW
===================================================== */

function closeCoursePreview() {

    const modal =
        document.getElementById(
            "coursePreviewModal"
        );


    if (modal) {

        modal.remove();

    }

}


/* =====================================================
   OPEN COURSE
===================================================== */

function openCourse(
    courseName
) {

    const container =
        document.getElementById(
            "coursesContainer"
        );


    if (!container) return;


    const files =
        Array.isArray(
            state.courseFiles
        )
            ? state.courseFiles.filter(
                file =>
                    file.course ===
                    courseName
            )
            : [];


    container.innerHTML = `

        <div
            class="course-detail-header"
        >

            <button
                class="course-back-button"
                onclick="renderCourses()"
            >
                ← Back to Courses
            </button>


            <div
                class="course-detail-title"
            >

                <span
                    class="section-label"
                >
                    COURSE
                </span>


                <h1>
                    ${escapeHTML(courseName)}
                </h1>


                <p>
                    View available learning
                    materials before downloading.
                </p>

            </div>

        </div>


        ${
            files.length > 0

                ? `

                    <div
                        class="course-file-list"
                    >

                        ${files
                            .map(file => {

                                const name =
                                    file.name ||
                                    "Course File";


                                const extension =
                                    getFileExtension(
                                        name
                                    ) ||
                                    "FILE";


                                const size =
                                    formatFileSize(
                                        file.size
                                    );


                                const date =
                                    file.lastModified
                                        ? formatDate(
                                            file.lastModified
                                        )
                                        : "Recently added";


                                return `

                                    <article
                                        class="course-file-card"
                                    >

                                        <div
                                            class="course-file-icon"
                                        >
                                            ${getFileIcon(
                                                extension
                                            )}
                                        </div>


                                        <div
                                            class="course-file-info"
                                        >

                                            <h3>
                                                ${escapeHTML(
                                                    name
                                                )}
                                            </h3>


                                            <div
                                                class="course-file-details"
                                            >

                                                <span>
                                                    ${escapeHTML(
                                                        extension.toUpperCase()
                                                    )}
                                                </span>


                                                <span>
                                                    ${escapeHTML(
                                                        size
                                                    )}
                                                </span>


                                                <span>
                                                    Updated
                                                    ${escapeHTML(
                                                        date
                                                    )}
                                                </span>

                                            </div>

                                        </div>


                                        <div
                                            class="course-file-actions"
                                        >

                                            <button
                                                class="course-view-button"
                                                onclick="
                                                    viewCourseFile(
                                                        '${escapeJS(file.key)}',
                                                        '${escapeJS(name)}'
                                                    )
                                                "
                                            >
                                                View
                                            </button>


                                            <button
                                                class="course-download-button"
                                                onclick="
                                                    downloadCourseFile(
                                                        '${escapeJS(file.key)}'
                                                    )
                                                "
                                            >
                                                Download
                                            </button>

                                        </div>

                                    </article>

                                `;

                            })
                            .join("")}

                    </div>

                `

                : `

                    ${emptyStateHTML(
                        "📄",
                        "No files available yet.",
                        "Files added to this course will appear here."
                    )}

                `
        }

    `;

}
/* =====================================================
   NOTES
===================================================== */

async function loadNotes() {

    const container =
        document.getElementById("notesContainer");

    if (!container) return;

    container.innerHTML =
        loadingHTML("Loading notes...");

    try {

        const response =
            await apiRequest("/resources?type=note");

        const allNotes =
            normalizeResources(response);

        state.notes =
            allNotes.filter(item => {

                const type =
                    String(
                        item.type ||
                        item.category ||
                        ""
                    ).toLowerCase();

                const key =
                    String(
                        item.s3_key ||
                        item.key ||
                        item.Key ||
                        ""
                    ).toLowerCase();

                return (
                    type.includes("note") ||
                    key.startsWith("notes/")
                );

            });

        renderNotes();

    } catch (error) {

        console.error(
            "Notes loading error:",
            error
        );

        container.innerHTML =
            errorStateHTML(
                "Failed to load notes.",
                "Please check the backend and S3 connection."
            );

    }

}


function renderNotes() {

    const container =
        document.getElementById("notesContainer");

    if (!container) return;

    if (!state.notes.length) {

        container.innerHTML =
            emptyStateHTML(
                "📚",
                "No notes available yet.",
                "Notes added to the S3 notes folder will appear here."
            );

        return;

    }

    container.innerHTML = `

        <div class="professional-file-grid">

            ${state.notes
                .map(
                    file =>
                        professionalFileCard(
                            file,
                            "notes"
                        )
                )
                .join("")}

        </div>

    `;

}
/* =====================================================
   STUDY RESOURCES
===================================================== */

async function loadResources() {

    const container =
        document.getElementById(
            "resourcesContainer"
        );

    if (!container) return;

    container.innerHTML =
        loadingHTML(
            "Loading study resources..."
        );

    try {

        const result =
            await Promise.allSettled([

                apiRequest(
                    "/resources"
                ),

                apiRequest(
                    "/resources/s3/list/files"
                )

            ]);

        const databaseFiles =
            normalizeResourcesFromResult(
                result[0]
            );

        const s3Files =
            normalizeResourcesFromResult(
                result[1]
            );

        const merged =
            mergeResources(
                databaseFiles,
                s3Files
            );

        state.resources =
            merged.filter(file => {

                const key =
                    String(
                        file.s3_key ||
                        file.key ||
                        file.Key ||
                        ""
                    ).toLowerCase();

                return (
                    key.startsWith(
                        "resources/"
                    )
                );

            });

        renderResources();

        updateDashboardResourceCount();

    } catch (error) {

        console.error(
            "Resources loading error:",
            error
        );

        container.innerHTML =
            errorStateHTML(
                "Failed to load resources.",
                "Please check the backend and S3 connection."
            );

    }

}


function renderResources() {

    const container =
        document.getElementById(
            "resourcesContainer"
        );

    if (!container) return;

    if (!state.resources.length) {

        container.innerHTML =
            emptyStateHTML(
                "📄",
                "No study resources available yet.",
                "Resources added to the S3 resources folder will appear here."
            );

        return;

    }

    container.innerHTML = `

        <div class="professional-file-grid">

            ${state.resources
                .map(
                    file =>
                        professionalFileCard(
                            file,
                            "resources"
                        )
                )
                .join("")}

        </div>

    `;

}


/* =====================================================
   PRACTICALS
===================================================== */

async function loadPracticals() {

    const container =
        document.getElementById(
            "practicalContainer"
        );

    if (!container) return;

    container.innerHTML =
        loadingHTML(
            "Loading practicals..."
        );

    try {

        const response =
            await apiRequest(
                "/practical"
            );

        const files =
            normalizeResources(
                response
            );

        state.practicals =
            files.filter(file => {

                const key =
                    String(
                        file.s3_key ||
                        file.key ||
                        file.Key ||
                        ""
                    ).toLowerCase();

                return (
                    key.startsWith(
                        "practicals/"
                    ) ||
                    !key
                );

            });

        renderPracticals();

    } catch (error) {

        console.error(
            "Practicals loading error:",
            error
        );

        container.innerHTML =
            errorStateHTML(
                "Failed to load practicals.",
                "Please check the backend and S3 connection."
            );

    }

}


function renderPracticals() {

    const container =
        document.getElementById(
            "practicalContainer"
        );

    if (!container) return;

    if (!state.practicals.length) {

        container.innerHTML =
            emptyStateHTML(
                "🧪",
                "No practicals available yet.",
                "Practical files added to S3 will appear here."
            );

        return;

    }

    container.innerHTML = `

        <div class="professional-file-grid">

            ${state.practicals
                .map(
                    file =>
                        professionalFileCard(
                            file,
                            "practicals"
                        )
                )
                .join("")}

        </div>

    `;

}


/* =====================================================
   PROFESSIONAL FILE CARD
===================================================== */

function professionalFileCard(
    resource,
    category
) {

    const title =
        resource.title ||
        resource.name ||
        resource.original_name ||
        resource.originalName ||
        resource.fileName ||
        resource.Key ||
        "File";


    const key =
        resource.s3_key ||
        resource.key ||
        resource.Key ||
        "";


    const extension =
        getFileExtension(title) ||
        "FILE";


    const size =
        formatFileSize(
            resource.size_bytes ||
            resource.size ||
            resource.Size
        );


    const modified =
        resource.lastModified ||
        resource.LastModified;


    const modifiedText =
        modified
            ? formatDate(modified)
            : "";


    return `

        <article class="professional-file-card">

            <div class="professional-file-icon">

                ${getFileIcon(extension)}

            </div>


            <div class="professional-file-content">

                <div class="professional-file-heading">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <span class="professional-file-type">
                        ${escapeHTML(
                            extension.toUpperCase()
                        )}
                    </span>

                </div>


                <div class="professional-file-meta">

                    ${
                        size
                            ? `<span>📦 ${escapeHTML(size)}</span>`
                            : ""
                    }

                    ${
                        modifiedText
                            ? `<span>🕒 ${escapeHTML(modifiedText)}</span>`
                            : ""
                    }

                </div>


                <div class="professional-file-actions">

                    ${
                        key
                            ? `

                                <button
                                    class="professional-view-button"
                                    onclick="
                                        viewResourceFile(
                                            '${escapeJS(key)}',
                                            '${escapeJS(title)}'
                                        )
                                    "
                                >
                                    View
                                </button>


                                <button
                                    class="professional-download-button"
                                    onclick="
                                        downloadResourceFile(
                                            '${escapeJS(key)}'
                                        )
                                    "
                                >
                                    Download
                                </button>

                            `
                            : `

                                <span class="muted">
                                    File link unavailable
                                </span>

                            `
                    }

                </div>

            </div>

        </article>

    `;

}
function normalizeResources(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.resources)) {
        return response.resources;
    }

    if (Array.isArray(response?.files)) {
        return response.files;
    }

    if (Array.isArray(response?.data?.files)) {
        return response.data.files;
    }

    return [];
}


function normalizeResourcesFromResult(result) {

    if (!result) {
        return [];
    }

    if (result.status !== "fulfilled") {
        return [];
    }

    return normalizeResources(
        result.value
    );
}

/* =====================================================
   VIEW RESOURCE FILE
===================================================== */

async function viewResourceFile(
    key,
    fileName
) {

    if (!key) {

        showToast(
            "File information is missing.",
            "error"
        );

        return;

    }


    try {

        const response =
    await apiRequest(
        `${key.startsWith("practicals/") ? "/practical/url" : "/resources/url"}?key=${encodeURIComponent(key)}`
    );


        const url =
            response?.url ||
            response?.downloadUrl ||
            response?.data?.url;


        if (!url) {

            throw new Error(
                "Preview URL unavailable."
            );

        }


        const extension =
            getFileExtension(
                fileName
            ).toLowerCase();


        if (
            extension === "pdf"
        ) {

            openResourcePreview(
                fileName,
                url
            );

            return;

        }


        if (
            extension === "docx" ||
            extension === "doc"
        ) {

            const officeViewer =
                "https://view.officeapps.live.com/op/view.aspx?src=" +
                encodeURIComponent(url);


            openResourcePreview(
                fileName,
                officeViewer
            );

            return;

        }


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

    } catch (error) {

        console.error(
            "Resource view error:",
            error
        );

        showToast(
            "Unable to preview this file.",
            "error"
        );

    }

}


/* =====================================================
   DOWNLOAD RESOURCE FILE
===================================================== */

async function downloadResourceFile(
    key
) {

    if (!key) return;

    try {

        const response =
            await apiRequest(
                `${key.startsWith("practicals/") ? "/practical/download" : "/resources/download"}?key=${encodeURIComponent(key)}`
            );


        const url =
            response?.url ||
            response?.downloadUrl ||
            response?.data?.url ||
            response?.data?.downloadUrl;


        if (!url) {

            throw new Error(
                "Download URL unavailable."
            );

        }


        const link =
            document.createElement("a");


        link.href = url;

        link.target = "_blank";

        link.rel =
            "noopener,noreferrer";

        link.click();

    } catch (error) {

        console.error(
            "Resource download error:",
            error
        );

        showToast(
            "Unable to download this file.",
            "error"
        );

    }

}


/* =====================================================
   RESOURCE PREVIEW MODAL
===================================================== */

function openResourcePreview(
    fileName,
    url
) {

    const oldModal =
        document.getElementById(
            "resourcePreviewModal"
        );

    if (oldModal) {
        oldModal.remove();
    }


    document.body.insertAdjacentHTML(
        "beforeend",
        `

            <div
                id="resourcePreviewModal"
                class="professional-preview-overlay"
                onclick="
                    if(event.target === this)
                        closeResourcePreview()
                "
            >

                <div
                    class="professional-preview-modal"
                >

                    <div
                        class="professional-preview-header"
                    >

                        <div>

                            <span
                                class="section-label"
                            >
                                FILE PREVIEW
                            </span>

                            <h2>
                                ${escapeHTML(fileName)}
                            </h2>

                        </div>


                        <button
                            class="professional-preview-close"
                            onclick="
                                closeResourcePreview()
                            "
                        >
                            ×
                        </button>

                    </div>


                    <div
                        class="professional-preview-body"
                    >

                        <iframe
                            src="${escapeHTML(url)}"
                            title="${escapeHTML(fileName)}"
                        ></iframe>

                    </div>

                </div>

            </div>

        `
    );

}


function closeResourcePreview() {

    const modal =
        document.getElementById(
            "resourcePreviewModal"
        );

    if (modal) {
        modal.remove();
    }

}/* =====================================================
   STUDY CENTER INITIALIZATION
===================================================== */

function initializeStudyCenter() {

    const form =
        document.getElementById(
            "studyTaskForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleStudyTaskSubmit
        );

    }


    /*
     * One single initialization.
     * No duplicate addStudyTaskBtn listeners.
     */

}


/* =====================================================
   ADD STUDY TASK
===================================================== */

async function handleStudyTaskSubmit(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "studyTaskInput"
        );


    const button =
        document.getElementById(
            "addStudyTaskBtn"
        );


    const message =
        document.getElementById(
            "studyTaskMessage"
        );


    if (!input) return;


    const title =
        input.value.trim();


    if (!title) {

        setFormMessage(
            message,
            "Please enter a study task.",
            "error"
        );

        return;

    }


    button.disabled = true;


    setFormMessage(
        message,
        "Saving task...",
        ""
    );


    try {

        const response =
            await apiRequest(
                "/study/tasks",
                {
                    method: "POST",

                    body: JSON.stringify({
                        title
                    })
                }
            );


        const newTask =
            response?.data ||
            response?.task ||
            response;


        if (newTask && typeof newTask === "object") {

            state.tasks.push(newTask);

        }


        input.value = "";


        setFormMessage(
            message,
            "Study task added successfully.",
            "success"
        );


        showToast(
            "Study task added.",
            "success"
        );


        await loadStudyCenter();


    } catch (error) {

        setFormMessage(
            message,
            error.message ||
            "Failed to add study task.",
            "error"
        );


        showToast(
            "Failed to add study task.",
            "error"
        );

    } finally {

        button.disabled = false;

    }

}


/* =====================================================
   LOAD STUDY CENTER
===================================================== */

async function loadStudyCenter() {

    try {

        const results =
            await Promise.allSettled([

                apiRequest("/study/tasks"),
                apiRequest("/study/progress"),
                apiRequest("/study/streak"),
                apiRequest("/exams")

            ]);


        state.tasks =
            extractArray(results[0]);

        state.progress =
            extractObject(results[1]);

        state.streak =
            extractObject(results[2]);

        state.exams =
            extractArray(results[3]);

        console.log(
            "EXAM API RESULT:",
            results[3]
        );

        console.log(
            "EXAM DATA:",
            state.exams
        );


        renderStudyTasks();

        updateStudyCenterStats();

        renderExams();

        updateDashboardUI();


    } catch (error) {

        showToast(
            "Failed to load Study Center.",
            "error"
        );

    }

}


/* =====================================================
   STUDY TASKS RENDER
===================================================== */

function renderStudyTasks() {

    const container =
        document.getElementById(
            "studyTasksContainer"
        );

    if (!container) return;


    if (!state.tasks.length) {

        container.innerHTML =
            emptyStateHTML(
                "✓",
                "No study tasks yet.",
                "Add your first study task above."
            );

        return;

    }


    container.innerHTML =
        state.tasks.map(task => {

            const completed =
                isTaskCompleted(task);


            const id =
                Number(task.id);


            return `

                <div class="task-item ${
                    completed
                        ? "completed"
                        : ""
                }">

                    <input
                        class="task-check"
                        type="checkbox"
                        ${
                            completed
                                ? "checked"
                                : ""
                        }
                        onchange="toggleStudyTask(${id}, this.checked)"
                    >


                    <div class="task-content">

                        <strong>
                            ${escapeHTML(
                                task.title ||
                                task.task ||
                                task.name ||
                                "Study Task"
                            )}
                        </strong>

                        <span>
                            ${
                                completed
                                    ? "Completed"
                                    : "Pending"
                            }
                        </span>

                    </div>


                    <button
                        class="task-delete"
                        title="Delete task"
                        onclick="deleteStudyTask(${id})"
                    >
                        ×
                    </button>

                </div>

            `;

        }).join("");

}


/* =====================================================
   TOGGLE STUDY TASK
===================================================== */

async function toggleStudyTask(
    id,
    completed
) {

    try {

        await apiRequest(
            `/study/tasks/${id}/completed`,
            {
                method: "PATCH",

                body: JSON.stringify({
                    completed
                })
            }
        );


        showToast(
            completed
                ? "Task completed."
                : "Task marked as pending.",
            "success"
        );


        await loadStudyCenter();

    } catch (error) {

        showToast(
            "Failed to update task.",
            "error"
        );

        await loadStudyCenter();

    }

}


/* =====================================================
   DELETE STUDY TASK
===================================================== */

async function deleteStudyTask(id) {

    if (!Number.isInteger(Number(id))) {

        showToast(
            "Invalid task.",
            "error"
        );

        return;

    }


    try {

        await apiRequest(
            `/study/tasks/${id}`,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Study task deleted.",
            "success"
        );


        await loadStudyCenter();

    } catch (error) {

        showToast(
            "Failed to delete study task.",
            "error"
        );

    }

}


/* =====================================================
   UPDATE STUDY CENTER STATS
===================================================== */

function updateStudyCenterStats() {

    const completed =
        state.tasks.filter(
            isTaskCompleted
        ).length;


    const total =
        state.tasks.length;


    const progress =
        calculateProgress(
            completed,
            total
        );


    const streak =
        getStreakValue(
            state.streak
        );


    setText(
        "studyCenterProgress",
        `${progress}%`
    );


    setText(
        "studyCenterCompleted",
        completed
    );


    setText(
        "studyCenterTotal",
        total
    );


    setText(
        "studyCenterStreak",
        `${streak} days`
    );


    setText(
        "studyProgressPercent",
        `${progress}%`
    );


    setWidth(
        "studyProgressBar",
        progress
    );


    setText(
        "studyProgressCompletedText",
        `${completed} completed`
    );


    setText(
        "studyProgressTotalText",
        `${total} total`
    );


    setText(
        "studyStreakValue",
        streak
    );

}


/* =====================================================
   EXAM CONTROLS
===================================================== */

function initializeExamControls() {

    const openButton =
        document.getElementById(
            "openExamFormBtn"
        );


    const cancelButton =
        document.getElementById(
            "cancelExamBtn"
        );


    const form =
        document.getElementById(
            "examForm"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openExamForm
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeExamForm
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            handleExamSubmit
        );

    }

}


/* =====================================================
   EXAM FORM
===================================================== */

function openExamForm() {

    const container =
        document.getElementById(
            "examFormContainer"
        );

    if (!container) return;


    container.classList.remove(
        "hidden"
    );

}


function closeExamForm() {

    const container =
        document.getElementById(
            "examFormContainer"
        );

    const form =
        document.getElementById(
            "examForm"
        );


    if (container) {

        container.classList.add(
            "hidden"
        );

    }


    if (form) {

        form.reset();

        document.getElementById(
            "examId"
        ).value = "";

    }

}


/* =====================================================
   EXAM SUBMIT
===================================================== */

async function handleExamSubmit(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "examId"
        ).value;


    const title =
        document.getElementById(
            "examTitle"
        ).value.trim();


    const subject =
        document.getElementById(
            "examSubject"
        ).value.trim();


    const examDate =
        document.getElementById(
            "examDate"
        ).value;


    const reminder =
        document.getElementById(
            "examReminder"
        ).checked;


    if (!title || !subject || !examDate) {

        showToast(
            "Please fill all exam fields.",
            "error"
        );

        return;

    }


    const payload = {

        title,
        subject,
        exam_date: examDate,

        reminder_enabled:
            reminder ? 1 : 0

    };


    try {

        if (id) {

            await apiRequest(
                `/exams/${id}`,
                {
                    method: "PUT",

                    body: JSON.stringify(
                        payload
                    )
                }
            );


            showToast(
                "Exam updated successfully.",
                "success"
            );

                        } else {

            const response = await apiRequest(
                "/exams",
                {
                    method: "POST",

                    body: JSON.stringify(
                        payload
                    )
                }
            );

            const newExam =
                response?.exam ||
                response?.data ||
                response;

            if (newExam && typeof newExam === "object") {

                state.exams.push(newExam);

            }

            renderExams();
            renderDashboardExams();

            showToast(
                "Exam added successfully.",
                "success"
            );

        }
        closeExamForm();

        await loadStudyCenter();

    } catch (error) {

        showToast(
            error.message ||
            "Failed to save exam.",
            "error"
        );

    }

}


/* =====================================================
   LOAD EXAMS
===================================================== */

function renderExams() {

    const container =
        document.getElementById(
            "examsContainer"
        );

    if (!container) return;


    if (!state.exams.length) {

        container.innerHTML =
            emptyStateHTML(
                "📅",
                "No exam data available yet.",
                "Add an exam to start tracking your exam readiness."
            );

        return;

    }


    const sorted =
        [...state.exams].sort(
            (a, b) =>
                new Date(
                    a.exam_date
                ) -
                new Date(
                    b.exam_date
                )
        );


    container.innerHTML =
        sorted.map(exam => {

            const reminder =
                exam.reminder_enabled === 1 ||
                exam.reminder_enabled === true ||
                exam.reminder_enabled === "1";


            return `

                <div class="exam-item">

                    <div>

                        <h4>
                            ${escapeHTML(
                                exam.title ||
                                "Exam"
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                exam.subject ||
                                "Subject not specified"
                            )}
                        </p>


                        <div class="exam-actions">

                            <button
                                class="small-button"
                                onclick="editExam(${Number(exam.id)})"
                            >
                                Edit
                            </button>

                            <button
                                class="small-button"
                                onclick="deleteExam(${Number(exam.id)})"
                            >
                                Delete
                            </button>

                        </div>

                    </div>


                    <div class="exam-date">

                        <strong>
                            ${formatDate(
                                exam.exam_date
                            )}
                        </strong>

                        <span>
                            ${
                                reminder
                                    ? "Reminder enabled"
                                    : "Reminder disabled"
                            }
                        </span>

                    </div>

                </div>

            `;

        }).join("");

}


/* =====================================================
   EXAM FORM SUBMIT
===================================================== */

const examForm = document.getElementById("examForm");

if (examForm) {

    examForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const examId =
            document.getElementById("examId").value.trim();

        const title =
            document.getElementById("examTitle").value.trim();

        const subject =
            document.getElementById("examSubject").value.trim();

        const examDate =
            document.getElementById("examDate").value;

        const reminderEnabled =
            document.getElementById("examReminder").checked;

        if (!title) {
            showToast(
                "Exam title is required.",
                "error"
            );
            return;
        }

        if (!examDate) {
            showToast(
                "Exam date is required.",
                "error"
            );
            return;
        }

        const examData = {
            title: title,
            subject: subject,
            exam_date: examDate,
            reminder_enabled: reminderEnabled
        };

        try {

            const url = examId
                ? `${API_BASE}/exams/${examId}`
                : `${API_BASE}/exams`;

            const method = examId
                ? "PUT"
                : "POST";

            const response =
                await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(examData)
                });

            const result =
                await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Failed to save exam."
                );
            }

            showToast(
                examId
                    ? "Exam updated successfully."
                    : "Exam added successfully.",
                "success"
            );

            examForm.reset();

            document.getElementById(
                "examId"
            ).value = "";

            await loadExams();

            openExamForm();

        } catch (error) {

            console.error(
                "Exam save error:",
                error
            );

            showToast(
                error.message ||
                "Failed to save exam.",
                "error"
            );
        }

    });

}
/* =====================================================
   DELETE EXAM
===================================================== */

function editExam(id) {
    const exam = state.exams.find(
        item => Number(item.id) === Number(id)
    );

    if (!exam) {
        showToast("Exam not found.", "error");
        return;
    }

    document.getElementById("examId").value = exam.id;
    document.getElementById("examTitle").value = exam.title || "";
    document.getElementById("examSubject").value = exam.subject || "";
    document.getElementById("examDate").value = exam.exam_date || "";

    document.getElementById("examReminder").checked =
        exam.reminder_enabled === 1 ||
        exam.reminder_enabled === true ||
        exam.reminder_enabled === "1";

    openExamForm();

    const formContainer =
        document.getElementById("examFormContainer");

    if (formContainer) {
        formContainer.scrollIntoView({
            behavior: "smooth"
        });
    }
}
/* =====================================================
   UPCOMING EXAMS
===================================================== */

function getUpcomingExams(exams) {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    return exams
        .filter(exam => {

            if (!exam.exam_date) {
                return false;
            }

            const date =
                new Date(
                    exam.exam_date
                );

            return date >= today;

        })
        .sort(
            (a, b) =>
                new Date(a.exam_date) -
                new Date(b.exam_date)
        );

}


/* =====================================================
   SETTINGS
===================================================== */

function initializeSettings() {

    const theme =
        document.getElementById(
            "themeSetting"
        );


    const fontSize =
        document.getElementById(
            "fontSizeSetting"
        );


    const studyNotifications =
        document.getElementById(
            "studyNotificationSetting"
        );


    const examNotifications =
        document.getElementById(
            "examNotificationSetting"
        );


    const reducedMotion =
        document.getElementById(
            "reducedMotionSetting"
        );


    if (theme) {

        theme.addEventListener(
            "change",
            () => {

                state.settings.theme =
                    theme.value;

                saveSettings();

                applySettings();

            }
        );

    }


    if (fontSize) {

        fontSize.addEventListener(
            "change",
            () => {

                state.settings.fontSize =
                    fontSize.value;

                saveSettings();

                applySettings();

            }
        );

    }


    if (studyNotifications) {

        studyNotifications.addEventListener(
            "change",
            () => {

                state.settings.studyNotifications =
                    studyNotifications.checked;

                saveSettings();

            }
        );

    }


    if (examNotifications) {

        examNotifications.addEventListener(
            "change",
            () => {

                state.settings.examNotifications =
                    examNotifications.checked;

                saveSettings();

            }
        );

    }


    if (reducedMotion) {

        reducedMotion.addEventListener(
            "change",
            () => {

                state.settings.reducedMotion =
                    reducedMotion.checked;

                saveSettings();

                applySettings();

            }
        );

    }


    const refreshButton =
        document.getElementById(
            "settingsRefreshBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadDashboardData();

                if (
                    state.currentPage ===
                    "study"
                ) {
                    await loadStudyCenter();
                }

                showToast(
                    "Portal data refreshed.",
                    "success"
                );

            }
        );

    }

}


/* =====================================================
   SETTINGS STORAGE
===================================================== */

function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                "digitalStudentPortalSettings"
            );


        if (saved) {

            const parsed =
                JSON.parse(saved);


            state.settings = {
                ...state.settings,
                ...parsed
            };

        }

    } catch (error) {

        console.error(
            "Settings load error:",
            error
        );

    }

}


function saveSettings() {

    localStorage.setItem(
        "digitalStudentPortalSettings",
        JSON.stringify(
            state.settings
        )
    );

}


function applySettings() {

    document.body.classList.remove(
        "theme-dark",
        "theme-brown"
    );


    document.body.classList.remove(
        "font-small",
        "font-medium",
        "font-large"
    );


    document.body.classList.toggle(
        "reduced-motion",
        Boolean(
            state.settings.reducedMotion
        )
    );


    let theme =
        state.settings.theme;


    if (theme === "auto") {

        const prefersDark =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        theme =
            prefersDark
                ? "dark"
                : "light";

    }


    if (theme === "dark") {

        document.body.classList.add(
            "theme-dark"
        );

    }


    if (theme === "brown") {

        document.body.classList.add(
            "theme-brown"
        );

    }


    document.body.classList.add(
        `font-${state.settings.fontSize}`
    );


    loadSettingsIntoUI();

}


function loadSettingsIntoUI() {

    const theme =
        document.getElementById(
            "themeSetting"
        );


    const fontSize =
        document.getElementById(
            "fontSizeSetting"
        );


    const studyNotifications =
        document.getElementById(
            "studyNotificationSetting"
        );


    const examNotifications =
        document.getElementById(
            "examNotificationSetting"
        );


    const reducedMotion =
        document.getElementById(
            "reducedMotionSetting"
        );


    if (theme) {
        theme.value =
            state.settings.theme;
    }


    if (fontSize) {
        fontSize.value =
            state.settings.fontSize;
    }


    if (studyNotifications) {
        studyNotifications.checked =
            state.settings.studyNotifications;
    }


    if (examNotifications) {
        examNotifications.checked =
            state.settings.examNotifications;
    }


    if (reducedMotion) {
        reducedMotion.checked =
            state.settings.reducedMotion;
    }

}


/* =====================================================
   SEARCH
===================================================== */

function initializeSearch() {

    const input =
        document.getElementById(
            "globalSearchInput"
        );


    if (!input) return;


    let timeout;


    input.addEventListener(
        "input",
        () => {

            clearTimeout(timeout);


            const query =
                input.value.trim();


            if (!query) {
                return;
            }


            timeout =
                setTimeout(
                    () => performSearch(query),
                    450
                );

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                const query =
                    input.value.trim();


                if (query) {
                    performSearch(query);
                }

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                input.focus();

            }

        }
    );

}


async function performSearch(query) {

    try {

        const response =
            await apiRequest(
                `/search?q=${encodeURIComponent(query)}`
            );


        const results =
            normalizeSearchResults(
                response
            );


        showAppPage("search");

        renderSearchResults(
            results,
            query
        );

    } catch (error) {

        showToast(
            "Search failed.",
            "error"
        );

    }

}


function normalizeSearchResults(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.results)) {
        return response.results;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    return [];

}


function renderSearchResults(
    results,
    query
) {

    const container =
        document.getElementById(
            "searchResultsContainer"
        );


    const title =
        document.getElementById(
            "searchPageTitle"
        );


    if (title) {

        title.textContent =
            `Search Results for "${query}"`;

    }


    if (!container) return;


    if (!results.length) {

        container.innerHTML =
            emptyStateHTML(
                "⌕",
                "No results found.",
                "Try a different search term."
            );

        return;

    }


    container.innerHTML =
        results.map(result => `

            <article class="search-result-item">

                <span class="search-result-type">
                    ${escapeHTML(
                        result.type ||
                        result.category ||
                        "Result"
                    )}
                </span>

                <h3>
                    ${escapeHTML(
                        result.title ||
                        result.name ||
                        "Search Result"
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        result.description ||
                        result.subject_name ||
                        result.course_name ||
                        ""
                    )}
                </p>

            </article>

        `).join("");

}


/* =====================================================
   REFRESH BUTTONS
===================================================== */

function initializeRefreshButtons() {

    document
        .querySelectorAll(
            "[data-refresh-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await showAppPage(
                        button.dataset.refreshPage
                    );

                }
            );

        });


    const refresh =
        document.getElementById(
            "headerRefreshBtn"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            async () => {

                await showAppPage(
                    state.currentPage
                );

                showToast(
                    "Data refreshed.",
                    "success"
                );

            }
        );

    }

}


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

function initializeMobileSidebar() {

    const menuButton =
        document.getElementById(
            "mobileMenuBtn"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openMobileSidebar
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }

}


function openMobileSidebar() {

    document
        .getElementById("sidebar")
        ?.classList.add("open");


    document
        .getElementById("sidebarOverlay")
        ?.classList.add("active");

}


function closeMobileSidebar() {

    document
        .getElementById("sidebar")
        ?.classList.remove("open");


    document
        .getElementById("sidebarOverlay")
        ?.classList.remove("active");

}


/* =====================================================
   LANDING PREVIEW
===================================================== */

function updateLandingPreview() {

    setText(
        "landingCourseCount",
        state.courses.length
    );


    setText(
        "landingResourceCount",
        state.resources.length
    );


    setText(
        "landingTaskCount",
        state.tasks.length
    );


    setText(
        "landingExamCount",
        state.exams.length
    );


    const completed =
        state.tasks.filter(
            isTaskCompleted
        ).length;


    const progress =
        calculateProgress(
            completed,
            state.tasks.length
        );


    setText(
        "landingProgress",
        `${progress}%`
    );


    setWidth(
        "landingProgressBar",
        progress
    );

}


/* =====================================================
   RESOURCE COUNT
===================================================== */

function updateDashboardResourceCount() {

    setText(
        "dashboardResourcesCount",
        state.resources.length
    );

}


/* =====================================================
   HELPERS
===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function setWidth(
    id,
    percentage
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    Number(percentage) || 0
                )
            )}%`;

    }

}


function loadingHTML(message) {

    return `

        <div class="loading-state">

            ${escapeHTML(message)}

        </div>

    `;

}


function emptyStateHTML(
    icon,
    title,
    message
) {

    return `

        <div class="empty-state">

            <div class="empty-icon">
                ${icon}
            </div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}


function errorStateHTML(
    title,
    message
) {

    return `

        <div class="empty-state">

            <div class="empty-icon">
                !
            </div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}


/* =====================================================
   TOAST
===================================================== */
function setFormMessage(element, message, type = "") {

    if (!element) return;

    element.textContent = message;

}

function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) return;


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =====================================================
   FORMAT FILE
===================================================== */

function formatFileSize(bytes) {

    const number =
        Number(bytes);


    if (!number || number <= 0) {
        return "";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(number) /
            Math.log(1024)
        );


    const safeIndex =
        Math.min(
            index,
            units.length - 1
        );


    return (
        number /
        Math.pow(
            1024,
            safeIndex
        )
    ).toFixed(
        safeIndex === 0 ? 0 : 1
    ) +
    " " +
    units[safeIndex];

}


function getFileExtension(
    filename
) {

    if (!filename) return "";

    const parts =
        String(filename)
            .split(".");


    if (parts.length < 2) {
        return "";
    }


    return parts.pop()
        .toUpperCase();

}


function getFileIcon(type) {

    const value =
        String(type)
            .toLowerCase();


    if (
        value.includes("pdf")
    ) {
        return "📕";
    }


    if (
        value.includes("doc")
    ) {
        return "📘";
    }


    if (
        value.includes("xls")
    ) {
        return "📗";
    }


    if (
        value.includes("ppt")
    ) {
        return "📙";
    }


    if (
        value.includes("image") ||
        value.includes("png") ||
        value.includes("jpg")
    ) {
        return "🖼️";
    }


    if (
        value.includes("zip")
    ) {
        return "🗜️";
    }


    return "📄";

}


/* =====================================================
   DATE
===================================================== */

function formatDate(dateValue) {

    if (!dateValue) {
        return "No date";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   SECURITY HELPERS
===================================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeJS(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        )
        .replaceAll(
            "\n",
            "\\n"
        )
        .replaceAll(
            "\r",
            "\\r"
        );

}


/* =====================================================
   AUTO THEME CHANGE
===================================================== */

if (
    window.matchMedia
) {

    const media =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    media.addEventListener(
        "change",
        () => {

            if (
                state.settings.theme ===
                "auto"
            ) {

                applySettings();

            }

        }
    );

}


/* =====================================================
   EXPOSE REQUIRED FUNCTIONS
===================================================== */

window.toggleStudyTask =
    toggleStudyTask;

window.deleteStudyTask =
    deleteStudyTask;

window.editExam =
    editExam;

window.deleteExam =
    deleteExam;

