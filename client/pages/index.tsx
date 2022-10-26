import type { NextPage } from 'next'
// import { wrapper } from '../store/store'
import Layout from '../components/layout'
import CustomLink from '../components/link'
import Image from 'next/image'
import workerGif from '../public/icons/icons8-work.gif'
import robotGif from '../public/icons/icons8-robot.gif'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import { setAdvisorState } from '../store/advisorSlice'
import { initialQuestionsState } from '../store/questions'
import { setResultState } from '../store/resultSlice'

const Home: NextPage = () => {
	const dispatch = useDispatch()
	const [initState, setInitState] = useState(false)

	if (!initState) {
		dispatch(setResultState({ assets: {}, riskTolerance: 0, svg: '', metadataUri: '' }))
		dispatch(setAdvisorState(initialQuestionsState))
		setInitState(true)
	}

	return (
		<Layout>
			<div className='flex flex-col justify-center items-center'>
				<h1 className='mb-2'>Welcome to Testudo v0.1</h1>
				<h1 className='text-2xl italic'>How would you like to pick your crypto portfolio?</h1>
			</div>
			<div className='mt-12 mb-5 flex justify-center'>
				<div className='w-56 flex items-center justify-center flex-col mr-5 p-7 border rounded drop-shadow-lg bg-white'>
					<Image width='100' height='100' src={workerGif}></Image>
					<div className='mt-9'>
						<CustomLink title='Manually' type='button' href='/manual' />
					</div>
				</div>
				<div className='w-56 flex items-center justify-center flex-col ml-5 p-7 border rounded drop-shadow-lg bg-white'>
					<Image width='100' height='100' src={robotGif}></Image>
					<div className='mt-9'>
						<CustomLink title='Robo-advisor' type='button' href='/amount' />
					</div>
				</div>
			</div>
		</Layout>
	)
}

export default Home

// export const getServerSideProps = wrapper.getServerSideProps((store) => async ({ params }) => {
//   // we can set the initial state from here
//   // we are setting to false but you can run your custom logic here
//   store.dispatch(setResultState([]))
//   console.log('State on server', store.getState())
//   return {
//     props: {
//       resultState: {},
//     },
//   }
// })
