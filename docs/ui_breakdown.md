# UI Screen Breakdown

Detailed breakdown of the screens required for the School Examination Paper Management System.

## 1. Login Screen
- **Fields**: Email, Password.
- **Actions**: Login button, "Forgot Password" link.
- **Design**: School branding, clean centralized card.

## 2. Super Admin Dashboard
- **Stats Cards**: Total Teachers, Pending Papers, Approved Today.
- **Sidebar**: Dashboard, User Management, Paper Approval, School Settings.
- **User Management**: Grid view of teachers with Add/Edit/Delete/Toggle Status.

## 3. Teacher Dashboard
- **Stats Cards**: My Papers, Drafts, Rejected (needs rework).
- **Sidebar**: Dashboard, Create Paper, My Papers, Profile.
- **Paper Creation (Stepper/Wizard UI)**:
    - **Step 1: Header Info** (Class, Subject, Type, Duration).
    - **Step 2: Questions** (Add Questions dynamically, auto-calculating marks).
    - **Step 3: Preview/Submit**.

## 4. Question Entry Interface
- **Question Type Toggle**: MCQ, Short, Long.
- **Rich Text Editor**: For question content.
- **Marks Input**: Number field.
- **MCQ Ops**: Fields for Options A, B, C, D if type is MCQ.

## 5. Paper Preview & PDF Export
- **Layout**: Split view (Preview on left, Print/Export buttons on right).
- **Rendering**: Real-time rendering of the template.

## 6. Accountant Dashboard
- **Grid View**: List of "Approved & Ready to Print" papers.
- **Actions**: View, Download PDF, Print Directly.

## 7. School Settings Page
- **Fields**: School Name, Address, Contact.
- **Image Picker**: For School Logo.
- **Defaults**: Default instructions for footer.
