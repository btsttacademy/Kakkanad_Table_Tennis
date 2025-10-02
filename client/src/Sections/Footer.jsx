import React from "react";
import color from "../../src/Assets/color.png";
import { LuInstagram } from "react-icons/lu";
import { FaFacebook } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div>
      <div 
        className="px-5 rounded-t-md"
        style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(50,50,50,0.95) 100%)"
        }}
      >
        <div className=" flex justify-between items-center pt-5">
          <div>
          <a href="#home"><img  className="w-14" src={color} alt="btsttacademy" /></a>
            
          </div>
          <div className=" flex gap-5 ">
            <LuInstagram className=" text-white hover:text-orange-500 cursor-pointer transition-colors duration-300" />
            <FaFacebook className=" text-white hover:text-orange-500 cursor-pointer transition-colors duration-300" />
          </div>
        </div>
        <p className=" py-7 font-in text-sm text-gray-300">
          Master the game. Master yourself. Professional table tennis training
          for all ages and skill levels.
        </p>

        <div className=" flex gap-5 max-[500px]:flex-col font-in">
          <a className=" text-white hover:text-orange-200 hover:underline transition-colors duration-300" href="#home">Home</a>
          <a className=" text-white hover:text-orange-200 hover:underline transition-colors duration-300" href="#about">About</a>
          <a className=" text-white hover:text-orange-200 hover:underline transition-colors duration-300" href="#testimonials">Testimonials</a>
          <a className=" text-white hover:text-orange-200 hover:underline transition-colors duration-300" href="#gallery">Gallery and Awards</a>
        </div>

         <p className="text-xs font-in text-slate-400 pt-10 pb-5">
        © {currentYear} BT's TT ACADEMY . All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;