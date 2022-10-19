import { ButtonUnstyled } from '@mui/base'

const CustomButton = ({ disabled, title, ...props }: any) => {
  return (
    <ButtonUnstyled
      disabled={disabled}
      componentsProps={{
        root: {
          className:
            'text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 disabled:opacity-40',
        },
      }}
      title={title}
      {...props}
    >
      {title}
    </ButtonUnstyled>
  )
}

export default CustomButton
