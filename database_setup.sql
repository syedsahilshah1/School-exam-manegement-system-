-- MySQL Database Script for School Examination Paper Management System

CREATE DATABASE IF NOT EXISTS SchoolExamDB;
USE SchoolExamDB;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    Role ENUM('SuperAdmin', 'Teacher', 'Accountant') NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS Classes (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    ClassName VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS Subjects (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SubjectName VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- 4. Papers Table
CREATE TABLE IF NOT EXISTS Papers (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    TeacherId INT,
    ClassId INT,
    SubjectId INT,
    ExamType VARCHAR(50),
    Duration VARCHAR(50),
    Status ENUM('Draft', 'Submitted', 'Approved', 'Rejected') DEFAULT 'Draft',
    McqInstruction TEXT,
    ShortInstruction TEXT,
    LongInstruction TEXT,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TeacherId) REFERENCES Users(Id),
    FOREIGN KEY (ClassId) REFERENCES Classes(Id),
    FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)
) ENGINE=InnoDB;

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS Questions (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    PaperId INT,
    QuestionText TEXT NOT NULL,
    QuestionType ENUM('MCQ', 'Short', 'Long'),
    Marks DECIMAL(5,2) NOT NULL,
    OptionsJSON TEXT, -- Stores MCQ options as JSON array
    FOREIGN KEY (PaperId) REFERENCES Papers(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. SchoolSettings Table
CREATE TABLE IF NOT EXISTS SchoolSettings (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    SchoolName VARCHAR(200) NOT NULL,
    LogoPath TEXT,
    DefaultTotalMarks INT,
    DefaultInstructions TEXT
) ENGINE=InnoDB;

-- Seed Initial Data
INSERT INTO Users (Name, Email, PasswordHash, Role, IsActive) 
VALUES ('Super Admin', 'admin@school.com', '$2b$10$YourHashedPasswordHere', 'SuperAdmin', 1);

INSERT INTO Classes (ClassName) VALUES ('Play Group'), ('Nursery'), ('Prep'), ('1st'), ('2nd'), ('3rd'), ('4th'), ('5th'), ('6th'), ('7th'), ('8th');

INSERT INTO Subjects (SubjectName) VALUES ('English'), ('Urdu'), ('Maths'), ('Drawing'), ('Nazra'), ('G.Knowledge'), ('Islamiat'), ('S.Study'), ('Science'), ('Chemistry'), ('Physics'), ('Biology'), ('MQ/Nazra');

INSERT INTO SchoolSettings (SchoolName, DefaultTotalMarks) 
VALUES ('Fatima Jinnah School and College Kohat', 100);
