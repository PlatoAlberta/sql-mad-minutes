export interface Student {
    id: number;
    name: string;
    email: string;
    major: string;
    year_started: number;
    gpa: number;
}

export interface Course {
    id: number;
    code: string;
    name: string;
    department: string;
    credits: number;
}

export interface Enrollment {
    student_id: number;
    course_id: number;
    grade: string;
    semester: string;
}

export const universityData = {
    students: [
        { id: 1, name: 'Alice Chen', email: 'alice@uni.edu', major: 'Computer Science', year_started: 2023, gpa: 3.8 },
        { id: 2, name: 'Bob Smith', email: 'bob@uni.edu', major: 'Physics', year_started: 2022, gpa: 3.2 },
        { id: 3, name: 'Charlie Kim', email: 'ckim@uni.edu', major: 'Mathematics', year_started: 2024, gpa: 3.9 },
        { id: 4, name: 'Diana Ross', email: 'diana@uni.edu', major: 'Computer Science', year_started: 2023, gpa: 3.5 },
        { id: 5, name: 'Evan Wright', email: 'evan@uni.edu', major: 'History', year_started: 2021, gpa: 2.9 },
        { id: 6, name: 'Fiona Gallagher', email: 'fiona@uni.edu', major: 'Physics', year_started: 2023, gpa: 3.6 },
        { id: 7, name: 'George Miller', email: 'george@uni.edu', major: 'Computer Science', year_started: 2022, gpa: 3.1 },
        { id: 8, name: 'Hannah Lee', email: 'hannah@uni.edu', major: 'Mathematics', year_started: 2024, gpa: 4.0 },
    ],
    courses: [
        { id: 101, code: 'CS101', name: 'Intro to Programming', department: 'Computer Science', credits: 4 },
        { id: 102, code: 'CS201', name: 'Data Structures', department: 'Computer Science', credits: 4 },
        { id: 103, code: 'MATH101', name: 'Calculus I', department: 'Mathematics', credits: 3 },
        { id: 104, code: 'PHYS101', name: 'Mechanics', department: 'Physics', credits: 4 },
        { id: 105, code: 'HIST101', name: 'World History', department: 'History', credits: 3 },
        { id: 106, code: 'CS301', name: 'Databases', department: 'Computer Science', credits: 3 },
    ],
    enrollments: [
        { student_id: 1, course_id: 101, grade: 'A', semester: 'Fall 2023' },
        { student_id: 1, course_id: 103, grade: 'A-', semester: 'Fall 2023' },
        { student_id: 2, course_id: 104, grade: 'B+', semester: 'Fall 2022' },
        { student_id: 3, course_id: 103, grade: 'A', semester: 'Spring 2024' },
        { student_id: 4, course_id: 101, grade: 'A', semester: 'Fall 2023' },
        { student_id: 4, course_id: 102, grade: 'B', semester: 'Spring 2024' },
        { student_id: 4, course_id: 106, grade: 'A-', semester: 'Spring 2024' },
        { student_id: 5, course_id: 105, grade: 'C+', semester: 'Fall 2021' },
    ]
};
