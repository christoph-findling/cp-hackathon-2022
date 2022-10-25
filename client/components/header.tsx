import { ConnectButton } from '@rainbow-me/rainbowkit'


const Header = () => {
	return <div className='flex w-full justify-between'>
		<span className="text-lg">testudo v0.1</span>
		<ConnectButton />
	</div>
}

export default Header
