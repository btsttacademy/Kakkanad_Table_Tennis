import { LuMessageCircle } from "react-icons/lu";
import { TbStarsFilled } from "react-icons/tb";


const CustomButton = ({
    rating, 
  text, 
  onClick, 
  type = 'button', 
  disabled = false,
  size = 'medium',
  fullWidth = false,
  loading = false ,
  message =false,
}) => {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        font-in tracking-wide
        relative
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : 'w-auto'}
        font-semibold
        text-white
        bg-orange-500
        shadow-lg
        hover:shadow-xl
        active:shadow-md
        rounded-lg
        transition-all
        duration-300
        ease-out
        transform
        hover:scale-105
        active:scale-95
        overflow-hidden
        group
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Shiny overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Button content */}
      <span className={`relative z-10 flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {rating && <TbStarsFilled />}
        {message && <LuMessageCircle className=' text-xl' />}
        {text}
      </span>
    </button>
  );
};

export default CustomButton;