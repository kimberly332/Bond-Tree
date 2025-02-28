import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, query, collection, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjeCUIj0xGoztxqLsWQ83XLHiPodp3fDU",
    authDomain: "tree-bond.firebaseapp.com",
    projectId: "tree-bond",
    storageBucket: "tree-bond.firebasestorage.app",
    messagingSenderId: "432958508988",
    appId: "1:432958508988:web:14e8472cb51f63ce1825b9",
    measurementId: "G-LKY5BJ10B5"
};

// Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase instances
export { auth, db };

export default class AuthManager {
    constructor() {
        // Set up auth state listener
        this.currentUser = null;

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        this.currentUser = userDoc.data();
                        this.currentUser.id = user.uid;
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                this.currentUser = null;
            }
        });
    }

    async signup(name, email, password, username) {
        try {
          // First create the Firebase Authentication user
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          try {
            // Now that the user is authenticated, check if username is taken
            const usernameQuery = await getDocs(
              query(collection(db, 'users'), where('username', '==', username))
            );
            
            if (!usernameQuery.empty) {
              // Delete the auth user we just created since username is taken
              await user.delete();
              
              return { 
                success: false, 
                code: 'username-exists',
                message: 'This username is already taken. Please choose another one.'
              };
            }
            
            // If username is available, create the user document
            const userData = {
              id: user.uid,
              username: username,
              name,
              email,
              friends: [],
              savedMoods: []
            };
        
            await setDoc(doc(db, 'users', user.uid), userData);
        
            // Set current user
            this.currentUser = userData;
        
            return { success: true };
          } catch (error) {
            // If something went wrong after creating the auth user, delete it
            await user.delete();
            throw error;
          }
        } catch (error) {
          console.error("Signup error:", error);
          
          // Return error information
          return { 
            success: false, 
            code: error.code,
            message: this.getErrorMessage(error.code)
          };
        }
      }

      
      // Helper method to get user-friendly error messages
      getErrorMessage(errorCode) {
        switch(errorCode) {
          case 'auth/email-already-in-use':
            return 'This email is already registered';
          case 'auth/invalid-email':
            return 'Please provide a valid email address';
          case 'auth/weak-password':
            return 'Password should be at least 6 characters';
          case 'auth/operation-not-allowed':
            return 'Account creation is currently disabled';
          default:
            return 'An error occurred during signup. Please try again.';
        }
      }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user document
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                this.currentUser = userDoc.data();
                this.currentUser.id = user.uid;
                return true;
            } else {
                console.error("User document not found");
                return false;
            }
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    }

    // Add this new method
  async checkUsernameAvailability(username) {
    try {
      const usernameQuery = await getDocs(
        query(collection(db, 'users'), where('username', '==', username))
      );
      
      return usernameQuery.empty;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  }

    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    }

    async addFriend(friendIdentifier) {
        if (!this.currentUser) return false;
      
        try {
          // Check if the input is an email or a username
          const isEmail = friendIdentifier.includes('@');
          
          // Create the appropriate query based on the input type
          let friendQuery;
          if (isEmail) {
            // Search by email
            friendQuery = await getDocs(
              query(collection(db, 'users'), where('email', '==', friendIdentifier))
            );
          } else {
            // Search by username
            friendQuery = await getDocs(
              query(collection(db, 'users'), where('username', '==', friendIdentifier))
            );
          }
      
          if (friendQuery.empty) {
            console.log("No user found with this identifier");
            return false;
          }
      
          // Get the first matching user (assuming emails and usernames are unique)
          const friendDoc = friendQuery.docs[0];
          const friendData = friendDoc.data();
          const friendEmail = friendData.email;
          
          // Check if already a friend
          if (this.currentUser.friends.includes(friendEmail)) {
            console.log("User is already a friend");
            return false;
          }
      
          // Update current user's friends
          const userRef = doc(db, 'users', this.currentUser.id);
          await updateDoc(userRef, {
            friends: arrayUnion(friendEmail)
          });
      
          // Update local state
          this.currentUser.friends = this.currentUser.friends || [];
          this.currentUser.friends.push(friendEmail);
      
          return true;
        } catch (error) {
          console.error("Add friend error:", error);
          return false;
        }
      }

      async deleteFriend(friendEmail) {
        if (!this.currentUser) return false;
      
        try {
          // Check if the user has this friend
          if (!this.currentUser.friends || !this.currentUser.friends.includes(friendEmail)) {
            return { success: false, message: "This person is not in your friends list" };
          }
      
          // Create a new friends array without the friend to delete
          const updatedFriends = this.currentUser.friends.filter(email => email !== friendEmail);
          
          // Update the current user's document
          const userRef = doc(db, 'users', this.currentUser.id);
          await updateDoc(userRef, {
            friends: updatedFriends
          });
      
          // Update local state
          this.currentUser.friends = updatedFriends;
      
          // Also remove the current user from the friend's list (for reciprocal friendship)
          const friendQuery = await getDocs(
            query(collection(db, 'users'), where('email', '==', friendEmail))
          );
      
          if (!friendQuery.empty) {
            const friendDoc = friendQuery.docs[0];
            const friendData = friendDoc.data();
            
            // Create a new friends array for the friend
            const friendUpdatedFriends = (friendData.friends || []).filter(email => 
              email !== this.currentUser.email
            );
            
            // Update the friend's document
            await updateDoc(doc(db, 'users', friendDoc.id), {
              friends: friendUpdatedFriends
            });
          }
      
          return { success: true };
        } catch (error) {
          console.error("Error deleting friend:", error);
          return { success: false, message: "Error removing friend" };
        }
      }  

    getFriends() {
        if (!this.currentUser) return [];
        return this.currentUser.friends || [];
    }

    async saveMood(moods, notes = '') {
        if (!this.currentUser) return false;

        try {
            const now = new Date();

            // Format the date as MM/DD
            const formattedDate = `${now.getMonth() + 1}/${now.getDate()}`;

            // Format the time as HH:MM AM/PM
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedTime = `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

            // Create mood entry
            const moodEntry = {
                date: formattedDate,
                time: formattedTime,
                timestamp: now.getTime(),
                moods: [...moods],
                notes: notes.trim()
            };

            // Update user document
            const userRef = doc(db, 'users', this.currentUser.id);
            await updateDoc(userRef, {
                savedMoods: arrayUnion(moodEntry)
            });

            // Refresh current user data
            const updatedUserDoc = await getDoc(userRef);
            this.currentUser = updatedUserDoc.data();
            this.currentUser.id = userRef.id;

            return true;
        } catch (error) {
            console.error("Error saving mood:", error);
            return false;
        }
    }

    getSavedMoods() {
        if (!this.currentUser) return [];
        return this.currentUser.savedMoods || [];
    }

    async getFriendsData() {
        if (!this.currentUser) return [];

        try {
            const friendEmails = this.currentUser.friends || [];
            const friendsData = [];

            // Fetch data for each friend
            for (const friendEmail of friendEmails) {
                const friendQuery = await getDocs(
                    query(collection(db, 'users'), where('email', '==', friendEmail))
                );

                if (!friendQuery.empty) {
                    const friendDoc = friendQuery.docs[0];
                    const friendData = friendDoc.data();

                    // Create a safe copy without sensitive information
                    const safeFriendData = {
                        id: friendDoc.id,
                        name: friendData.name,
                        email: friendData.email,
                        savedMoods: friendData.savedMoods || []
                    };

                    friendsData.push(safeFriendData);
                }
            }

            return friendsData;
        } catch (error) {
            console.error("Error getting friends data:", error);
            return [];
        }
    }
}

// Helper function to initialize sample users if needed
export async function initializeSampleUsers() {
    try {
        // Check if there are any users in the database
        const usersQuery = await getDocs(collection(db, 'users'));
        
        if (usersQuery.empty) {
            const authManager = new AuthManager();
            
            // Create sample users
            await authManager.signup('John Doe', 'john@example.com', 'password123');
            await authManager.signup('Jane Smith', 'jane@example.com', 'password456');
            
            console.log('Sample users created successfully');
        }
    } catch (error) {
        console.error('Error initializing sample users:', error);
    }
}