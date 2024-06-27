import { ILesson } from "../models/lessons.interface";
import { IProgress } from "../models/progress.interface";

export const bbLessonsInit: ILesson[] = [
    {
        id: "bblesson01",
        name: "Sealed Book and Revelation",
        description: "",
        category: "bb",
        path: "BB Lesson 1",
        language: "English",
        instructor: "Thomas",
        lessonNo: "1"
    },
    {
        id: "bblesson02",
        name: "Seed and Harvest (Sign of Second Coming)",
        description: "",
        category: "bb",
        path: "BB Lesson 2",
        language: "English",
        instructor: "Thomas",
        lessonNo: "2"
    },
    {
        id: "bblesson03",
        name: "How to read Prophecy (Prophecy and Secrets of the Kingdom of Heaven in Parable) ",
        description: "",
        category: "bb",
        path: "BB Lesson 3",
        language: "English",
        instructor: "Thomas",
        lessonNo: "3"
    },
    {
        id: "bblesson04",
        name: "Introduction to Revelation",
        description: "",
        category: "bb",
        path: "BB Lesson 4",
        language: "English",
        instructor: "Thomas",
        lessonNo: "4"
    },
    {
        id: "bblesson05",
        name: "Moses\’s Tabernacle & Copy and Shadow/Reality",
        description: "",
        category: "bb",
        path: "BB Lesson 5",
        language: "English",
        instructor: "Thomas",
        lessonNo: "5"
    },
    {
        id: "bblesson06",
        name: "Elementary teaching and teaching of righteousness for the mature",
        description: "",
        category: "bb",
        path: "BB Lesson 6",
        language: "English",
        instructor: "Thomas",
        lessonNo: "6"
    },
    {
        id: "bblesson07",
        name: "God’s covenants (OT and NT)",
        description: "",
        category: "bb",
        path: "BB Lesson 7",
        language: "English",
        instructor: "Thomas",
        lessonNo: "7"
    },
    {
        id: "bblesson08",
        name: "God’s will and purpose (6,000 years of God’s work and history)",
        description: "",
        category: "bb",
        path: "BB Lesson 8",
        language: "English",
        instructor: "Thomas",
        lessonNo: "8"
    },
]


export const progressData: IProgress = {
    id: "",
    email: "",
    classId: "",
    userId: "",
    categoryProgress: [
        {
            categoryName: "BB",
            locked: false,
            progress: '0',
            lessons: [
                {
                    id: "bblesson01",
                    name: "Sealed Book and Revelation",
                    lessonNo: "1",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: false,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson02",
                    name: "Seed and Harvest (Sign of Second Coming)",
                    lessonNo: "2",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson03",
                    name: "How to read Prophecy (Prophecy and Secrets of the Kingdom of Heaven in Parable)",
                    lessonNo: "3",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson04",
                    name: "Introduction to Revelation",
                    lessonNo: "4",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson05",
                    name: "Moses\’s Tabernacle & Copy and Shadow/Reality",
                    lessonNo: "5",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson06",
                    name: "Elementary teaching and teaching of righteousness for the mature",
                    lessonNo: "6",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson07",
                    name: "God’s covenants (OT and NT)",
                    lessonNo: "7",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                },
                {
                    id: "bblesson08",
                    name: "God’s will and purpose (6,000 years of God’s work and history)",
                    lessonNo: "8",
                    watchDuration: 0,
                    progress: '0',
                    completed: false,
                    locked: true,
                    startDate: null,
                    completedDate: null,
                    postQuizId: null
                }
            ]
        },
        {
            categoryName: 'Introductory',
            progress: '0',
            locked: true,
            lessons: []
        },
        {
            categoryName: 'Intermediate',
            progress: '0',
            locked: true,
            lessons: []
        },
        {
            categoryName: 'Advanced',
            progress: '0',
            locked: true,
            lessons: []
        }
    ]
}