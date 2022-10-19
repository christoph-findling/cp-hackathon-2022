import { useSelector, useDispatch } from 'react-redux'
import { selectAuthState, setAuthState } from '../store/authSlice'
import Button from './button'

const Header = () => {
  const authState = useSelector(selectAuthState)
  const dispatch = useDispatch()
  return (
    <div className='flex w-full justify-between'>
      <div>LEFT</div>
      <div>
        <span>AuthState: {authState ? 'Logged in' : 'Logged out'}</span>
        <br />
        <a onClick={() => dispatch(setAuthState(!authState))}>
          <Button title={authState ? 'Log out' : 'Login'}></Button>
        </a>
      </div>
    </div>
  )
}

export default Header
