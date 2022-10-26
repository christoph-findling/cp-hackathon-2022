import { InputUnstyled } from '@mui/base'
import type { NextPage } from 'next'
import Image from 'next/image'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import Layout from '../components/layout'
import CustomLink from '../components/link'
import usdcIcon from '../public/icons/usdc.webp'
import { setResultState } from '../store/resultSlice'

const Amount: NextPage = () => {
	const [amount, setAmount] = useState(100)
	const dispatch = useDispatch()

	return (
		<Layout>
			<div className='flex flex-col justify-center items-center'>
				<h1 className='mb-2'>First things first...</h1>
				<h1 className='text-2xl italic'>
					Please select the amount of USDC you would like to invest
				</h1>
			</div>
			<div className='mt-12 mb-5 flex justify-center items-center relative'>
				<InputUnstyled
					value={amount}
					onChange={(event) => setAmount(parseInt(event.target.value))}
					type='number'
					required
					componentsProps={{ input: { className: 'w-48 mx-2 border rounded p-2 text-2xl pr-10' } }}
				/>
				<div
					style={{ right: 'calc(50% - 90px)' }}
					className='flex items-center justify-center absolute'
				>
					<Image src={usdcIcon} width='30' height='30' className='' />
				</div>
			</div>
			<div className='mt-12 flex items-center justify-around'>
				<CustomLink type='button' href='/' title='Back' />
				<CustomLink
					onClick={() => dispatch(setResultState({ amount }))}
					type='button'
					href='/advisor'
					title='Confirm & Continue'
				/>
			</div>
		</Layout>
	)
}

export default Amount
