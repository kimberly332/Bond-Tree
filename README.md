# BondTree

BondTree is a web application that helps users track their emotional well-being and connect with friends. The app allows users to create "mood balls" representing their emotional state, share these with friends, and maintain a personal journal.

## Features

### User Authentication
- Sign up with email, password, and username
- Login with email/username and password
- Password reset functionality
- Session management

### Mood Tracking
- Create mood balls by selecting up to 3 emotions
- Add custom moods with personalized colors and emojis
- Add notes to mood entries
- View mood history
- Delete saved moods

### Friends (Bonds)
- Send friend requests by email or username
- Accept or reject friend requests
- View friends' mood history
- Remove friends
- See a visualization of your "bondship tree" growing based on connections

### Journal
- Create private, friend-only, or public posts
- Add media attachments (images/videos)
- Edit and delete posts
- Filter posts by privacy level
- Download posts as text

## Project Structure

```
/
├── index.html              # Main login/dashboard page
├── mood-ball.html          # Mood tracking page
├── posts.html              # Journal posts page
├── 404.html                # Custom 404 error page
├── css/
│   ├── auth.css            # Authentication styles
│   ├── mood-ball.css       # Mood tracking styles
│   ├── posts.css           # Journal styles
│   ├── custom-mood-styles.css # Custom mood feature styles
│   ├── bond-tree-enhanced-friends.css # Friend visualization styles
│   └── unified-buttons.css # Consistent button styling
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── dashboard-buttons.js # Dashboard interaction
│   ├── auth/
│   │   ├── auth-manager.js # Authentication functionality
│   │   └── auth.js         # Auth UI controllers
│   ├── mood/
│   │   ├── mood-ball.js    # Mood tracking functionality
│   │   ├── custom-mood-manager.js # Custom mood storage
│   │   ├── custom-mood-functionality.js # Custom mood UI
│   │   └── mood-emoji-utils.js # Emoji utilities
│   └── posts/
│       ├── posts-manager.js # Posts data management
│       └── posts.js         # Posts UI controllers
└── assets/
    └── images/
        └── bond-tree-logo.svg # App logo
```

## Technologies Used

- Firebase Authentication for user management
- Firebase Firestore for data storage
- Firebase Storage for media uploads
- Firebase Hosting for deployment
- ES Modules for JavaScript organization
- CSS3 for styling and animations
- Responsive design for mobile compatibility

## Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/bond-tree.git
cd bond-tree
```

2. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```

3. Log in to Firebase:
```bash
firebase login
```

4. Initialize Firebase (skip if already initialized):
```bash
firebase init
```
Select Firestore, Storage, and Hosting during setup.

5. Deploy to Firebase:
```bash
firebase deploy
```

## Local Development

To run the app locally:

```bash
firebase serve
```

This will start a local development server at http://localhost:5000.

## Security Rules

The project includes Firestore security rules in `firestore.rules` that control access to data:

- Users can only read/write their own data
- Friend requests use special permissions to allow cross-user connections
- Privacy settings on posts determine who can view them

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Created by Kimberly Wang (2025)