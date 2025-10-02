import React from 'react'
import color from "../../src/Assets/color.png"

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div >
      <div className='flex items-center justify-between j '>
        <img className='w-14' src={color} alt="Company Logo" />
        
        {/* Copyright Text */}
        <div className='text-white text-center '>
          <p className='text-sm'>
            © {currentYear} BT's TT ACADEMY . All rights reserved.
          </p>
        </div>
      </div>
      <div className='text-white text-center bg-orange-600 rounded-sm  '>
          <p className='text-sm'>
            © {currentYear} BT's TT ACADEMY . All rights reserved.
          </p>
        </div>
    </div>
  )
}

export default Footer