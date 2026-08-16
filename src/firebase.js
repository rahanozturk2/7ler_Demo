import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Bu anahtarlar gizli degil. Firebase web anahtarlari herkese acik olacak
// sekilde tasarlanmistir; guvenlik Firestore kurallarindan gelir.
const firebaseConfig = {
  apiKey: 'AIzaSyBP_TEuHtg6xmmm4bFWViZB3muaupZk1Zs',
  authDomain: 'lerdemo-b3239.firebaseapp.com',
  projectId: 'lerdemo-b3239',
  storageBucket: 'lerdemo-b3239.firebasestorage.app',
  messagingSenderId: '678150953532',
  appId: '1:678150953532:web:7103f5f6c3c99fda200139'
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
