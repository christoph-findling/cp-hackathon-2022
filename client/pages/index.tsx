import type { NextPage } from 'next'
import Layout from '../components/layout'
import { wrapper } from '../store/store'
import { setAuthState } from '../store/authSlice'
import CustomLink from '../components/link'
import CustomButton from '../components/button'

const Home: NextPage = () => {

  return (
    <Layout>
      <div className='w-1/2'>
        <CustomLink href='/test' type="button" title="CustomLink Button"/>
        <CustomButton title="CustomButton"/>
      </div>
    </Layout>
  )
}

export default Home

export const getServerSideProps = wrapper.getServerSideProps((store) => async ({ params }) => {
  // we can set the initial state from here
  // we are setting to false but you can run your custom logic here
  store.dispatch(setAuthState([]))
  console.log('State on server', store.getState())
  return {
    props: {
      authState: true,
    },
  }
})
