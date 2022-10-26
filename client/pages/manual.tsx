import { NextPage } from 'next'
import Layout from '../components/layout'
import AssetSelector from '../components/slider'
import CustomLink from '../components/link'
import { useState } from 'react'

const Manual: NextPage = () => {
	const [selectionValid, setSelectionState] = useState(false)

	return (
		<Layout>
			<div className='w-full flex items-center justify-center'>
				<div className='w-3/5'>
					<div className='p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100'>
						<AssetSelector interactive={true} />
					</div>
					<div className='w-full flex justify-between items-center'>
						<CustomLink href='/' title='Back' type='button' />
						<CustomLink disabled={!selectionValid} href='/' title='Continue' type='button' />
					</div>
				</div>
			</div>
		</Layout>
	)
}

export default Manual
