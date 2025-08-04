import Image from "next/image"
import LogoImage from '@/assets/images/TSA_Logo_Primary_Black_RGB.png'

const Logo = () => {
  return (
    <Image 
    src={LogoImage}
    alt="tsa-logo"
    width={72}
    height={72}
    />
  )
}

export default Logo