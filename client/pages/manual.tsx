import { NextPage } from 'next'
import Layout from '../components/layout'
import AssetSelector from '../components/slider'
import CustomLink from '../components/link'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectResultState, setResultState } from '../store/resultSlice'
import { Result } from './advisor'

const Manual: NextPage = () => {
    const resultState = useSelector(selectResultState)
    const [selectionValid, setSelectionState] = useState(false)
    const dispatch = useDispatch()

    const selectionChanged = (result: Result) => {
        console.log(result)
        // if (!selectionValid) return;
        dispatch(setResultState(result))
    }

	return (
		<Layout>
			<div className='w-full flex items-center justify-center'>
				<div className='w-3/5'>
					<div className='p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100'>
						<AssetSelector selectionStateChanged={setSelectionState} />
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
