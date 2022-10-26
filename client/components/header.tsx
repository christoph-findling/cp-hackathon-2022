import { ConnectButton } from '@rainbow-me/rainbowkit'
import CustomLink from './link'

const Header = () => {
	return (
		<div className='mt-2 flex w-full justify-between items-center'>
			<CustomLink className='text-lg cursor-pointer' href='/' title='testudo v0.1' />
			<ConnectButton />
		</div>
	)
}

export default Header
