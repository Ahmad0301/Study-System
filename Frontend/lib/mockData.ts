export const mockUser = {
  id: "user-1",
  fullName: "Alex Johnson",
  email: "alex@example.com",
  avatar: null,
};

export const mockSubjects = [
  { id: "physics-101", name: "Physics 101", description: "Mechanics, thermodynamics, and electromagnetism", color: "#2563EB", filesCount: 3, createdAt: "2024-01-10", progress: 72 },
  { id: "world-history", name: "World History", description: "Ancient civilizations to modern times", color: "#4F46E5", filesCount: 2, createdAt: "2024-01-12", progress: 55 },
  { id: "computer-science", name: "Computer Science", description: "Algorithms, data structures, and programming", color: "#0891B2", filesCount: 1, createdAt: "2024-01-15", progress: 88 },
  { id: "biology-201", name: "Biology 201", description: "Cell biology, genetics, and evolution", color: "#059669", filesCount: 3, createdAt: "2024-01-18", progress: 40 },
  { id: "chemistry", name: "Chemistry", description: "Organic and inorganic chemistry fundamentals", color: "#DC2626", filesCount: 1, createdAt: "2024-01-20", progress: 60 },
  { id: "english-lit", name: "English Literature", description: "Classic and contemporary literary works", color: "#D97706", filesCount: 4, createdAt: "2024-01-22", progress: 90 },
];

export const mockMaterials: Record<string, any[]> = {
  "physics-101": [
    { id: "f1", name: "Kinematics_Notes.pdf", type: "pdf", size: "3.1 MB", uploadedAt: "25-12-2022 17:33", subjectId: "physics-101" },
    { id: "f2", name: "Dynamics_Lecture.docx", type: "docx", size: "6.1 MB", uploadedAt: "25-12-2022 17:35", subjectId: "physics-101" },
    { id: "f3", name: "Dynamics_Lecture.pdf", type: "pdf", size: "3.1 MB", uploadedAt: "26-12-2022 17:35", subjectId: "physics-101" },
  ],
  "world-history": [
    { id: "f4", name: "Ancient_Civilizations.pdf", type: "pdf", size: "4.2 MB", uploadedAt: "20-01-2024 09:00", subjectId: "world-history" },
    { id: "f5", name: "Modern_History.docx", type: "docx", size: "2.8 MB", uploadedAt: "21-01-2024 11:30", subjectId: "world-history" },
  ],
  "computer-science": [
    { id: "f6", name: "Algorithms_Guide.pdf", type: "pdf", size: "5.5 MB", uploadedAt: "15-01-2024 14:00", subjectId: "computer-science" },
  ],
};

export const mockActivities = [
  { id: "a1", type: "upload", text: "Uploaded Kinematics_Notes.pdf to Physics 101", time: "2 hours ago" },
  { id: "a2", type: "quiz", text: "Completed quiz on World History — Score: 90%", time: "5 hours ago" },
  { id: "a3", type: "flashcard", text: "Studied 20 flashcards in Computer Science", time: "Yesterday" },
  { id: "a4", type: "summary", text: "Generated AI summary for Biology 201", time: "2 days ago" },
  { id: "a5", type: "subject", text: "Created new subject: English Literature", time: "3 days ago" },
];

export const mockStats = {
  totalSubjects: 0,
  subjectsThisMonth: 0,
  uploadedFiles: 0,
  filesThisWeek: 0,
  avgQuizScore: 88,
  completedActivities: 0,
};

export const mockSummary = {
  title: "Newton's Laws of Motion",
  subject: "Physics 101",
  sections: [
    { heading: "Overview", bullets: [
      "Newton's First Law: An object at rest stays at rest unless acted upon by a net external force.",
      "Newton's Second Law: Force equals mass times acceleration (F = ma).",
      "Newton's Third Law: For every action there is an equal and opposite reaction.",
    ]},
    { heading: "Key Formulas", bullets: [
      "F = ma — Net force equals mass times acceleration.",
      "W = mg — Weight is the gravitational force on an object.",
      "p = mv — Momentum equals mass times velocity.",
    ]},
    { heading: "Applications", bullets: [
      "Explains planetary motion and satellite orbits.",
      "Foundation for classical mechanics and engineering.",
      "Used in vehicle safety design and sports science.",
    ]},
  ],
  keyTakeaways: [
    "Forces cause changes in motion, not motion itself.",
    "Acceleration is directly proportional to force and inversely proportional to mass.",
    "Action-reaction pairs never cancel because they act on different objects.",
  ],
};

export const mockChatMessages = [
  { id: "m1", role: "user", text: "Can you explain Newton's Second Law in simple terms?", time: "10:02 AM" },
  { id: "m2", role: "ai", text: "Newton's Second Law states that the acceleration of an object depends on two things: the net force applied to it and its mass. The greater the force, the greater the acceleration. The heavier the object, the less it accelerates for the same force. This is summarised as F = ma.", time: "10:02 AM" },
  { id: "m3", role: "user", text: "Give me an example with numbers.", time: "10:03 AM" },
  { id: "m4", role: "ai", text: "Sure! If you push a 5 kg box with a force of 20 N, the acceleration is: a = F/m = 20/5 = 4 m/s². That means the box speeds up by 4 metres per second every second you keep pushing it.", time: "10:03 AM" },
];

export const mockFlashcards = [
  { id: "fc1", front: "What is Newton's Second Law?", back: "Force = Mass × Acceleration (F = ma)" },
  { id: "fc2", front: "Define momentum.", back: "Momentum = Mass × Velocity (p = mv)" },
  { id: "fc3", front: "What is the SI unit of force?", back: "Newton (N) — equivalent to kg·m/s²" },
  { id: "fc4", front: "State Newton's Third Law.", back: "For every action there is an equal and opposite reaction." },
  { id: "fc5", front: "What does inertia mean?", back: "The tendency of an object to resist changes in its state of motion." },
  { id: "fc6", front: "Formula for gravitational force?", back: "W = mg, where g ≈ 9.8 m/s²" },
];

export const mockQuiz = [
  { id: "q1", question: "Which of Newton's Laws states that F = ma?", options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"], correct: 1 },
  { id: "q2", question: "A 10 kg object experiences a force of 50 N. What is its acceleration?", options: ["0.2 m/s²", "500 m/s²", "5 m/s²", "50 m/s²"], correct: 2 },
  { id: "q3", question: "Newton's First Law is also known as the Law of:", options: ["Momentum", "Inertia", "Acceleration", "Gravity"], correct: 1 },
  { id: "q4", question: "What happens to acceleration if mass doubles while force stays constant?", options: ["Doubles", "Stays the same", "Halves", "Quadruples"], correct: 2 },
  { id: "q5", question: "Which law explains why a rocket accelerates forward when gas is expelled backward?", options: ["First Law", "Second Law", "Third Law", "Coulomb's Law"], correct: 2 },
];

export const mockWeeklyStudyStats = [
  { day: "Mon", hours: 2.5, quizzes: 2 },
  { day: "Tue", hours: 4.0, quizzes: 3 },
  { day: "Wed", hours: 1.8, quizzes: 1 },
  { day: "Thu", hours: 5.2, quizzes: 4 },
  { day: "Fri", hours: 3.6, quizzes: 2 },
  { day: "Sat", hours: 6.0, quizzes: 5 },
  { day: "Sun", hours: 4.5, quizzes: 3 },
];
