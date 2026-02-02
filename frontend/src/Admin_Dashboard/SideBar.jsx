
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeDollarSign, ChevronRight, Fence, HandCoins, LayoutDashboard, Mail, MessageCircle, Settings, SquareUserRound, Star, User, User2Icon, Video } from 'lucide-react';
import { MdAttachEmail, MdEmail, MdMarkEmailRead, MdOutlineAttachEmail } from "react-icons/md";


const Doctor_Side_Bar = ({ side }) => {
    const [isactive, setIsactive] = useState(0)
    const [isopentoggle, setIsopentoggle] = useState(false)
    const isopen = (ind)=>{
        setIsactive(ind)
        setIsopentoggle(!isopentoggle)
    }
  return (
    <div>
        <div id="sidebar-wrapper" className={`${side ? "open":""} bg-[#3B5EB7]`}>
            <div className="sidebar hover:overflow-y-auto h-full scrollbar-hide scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-500 hover:scrollbar-thumb-blue-700">
            <ul className=" px-2 py-6 text-white relative">
               
                <li id="cc" className={`flex justify-between p-2 rounded-lg mt-12 mb-4`} onClick={()=>isopen(0)}>
                <Link to='/admin/dashboard'>
                <div className=" flex justify-center space-x-2">
                      <LayoutDashboard/> <p className=" cursor-pointer">DashBoard</p>
                  </div>
                </Link>
              </li>
                  <li className=" my-4">
                    <div id="cc" className={`flex justify-between p-2 rounded-lg`} onClick={()=>isopen(2)}>
                    <div className=" flex justify-center  space-x-2">
                         <Fence/> <p className=" cursor-pointer">Coaches</p>
                     </div>
                     <div className="arrow">
                             <ChevronRight
        className={`transition-transform duration-500 ease-in-out ${
          isopentoggle && isactive === 2 ? "rotate-90" : ""
        }`}
      />
                     </div>
                    </div>
                     <div className={`submenu-wrapper ${isactive===2 && isopentoggle===true ? "colaps":"colapsd"}`}>
                         <ul className="submenu text-start pl-8 border-l-2 mt-2">
                         <li className="my-2"><Link to="/admin/dashboard/alladvisors">AI Coache</Link></li>
                         {/* <li className="my-2"><Link to="/admin-dashboard-myproperties">My Properties</Link></li> */}
                         <li className="my-2"><Link to="/admin/dashboard/add-advisor">Add AI Coache</Link></li>
                          <li className="my-2"><Link to="/admin/dashboard/add-humancoach">Add Human Coache</Link></li>
                            <li className="my-2"><Link to="/admin/dashboard/humancoach"> Human Coache</Link></li>
                              <li className="my-2"><Link to="/admin/dashboard/newcoach"> New Coache</Link></li>



                         </ul>
                     </div>
                 </li>
                  <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/transactions'> 
                  <div className=" flex justify-center space-x-2">
                        <BadgeDollarSign/> <p className=" cursor-pointer">Transactions</p>
                    </div>
                  </Link>
                </li>
                 <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/users-chat'> 
                  <div className=" flex justify-center space-x-2">
                        <MessageCircle/> <p className=" cursor-pointer">AI Chats</p>
                    </div>
                  </Link>
                </li>
<li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/human-chat'> 
                  <div className=" flex justify-center space-x-2">
                        <MessageCircle/> <p className=" cursor-pointer">Human Chats</p>
                    </div>
                  </Link>
                </li>
                  <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/allusers'> 
                  <div className=" flex justify-center space-x-2">
                        <User2Icon/> <p className=" cursor-pointer">Users</p>
                    </div>
                  </Link>
                </li>
                  <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/reviews'> 
                  <div className=" flex justify-center space-x-2">
                        <Star/> <p className=" cursor-pointer">Reviews</p>
                    </div>
                  </Link>
                </li>
                <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/human-reviews'> 
                  <div className=" flex justify-center space-x-2">
                        <Star/> <p className=" cursor-pointer">Coach Reviews</p>
                    </div>
                  </Link>
                </li>
                <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/video_update'> 
                  <div className=" flex justify-center space-x-2">
                        <Video/> <p className=" cursor-pointer">Video Thumbnail</p>
                    </div>
                  </Link>
                </li>
              <li id="cc" className={`flex justify-between p-2 rounded-lg my-4`} onClick={()=>isopen(1)}>
                  <Link to='/admin/dashboard/sendmail'> 
                  <div className=" flex justify-center space-x-2">
                        <MdOutlineAttachEmail/> <p className=" cursor-pointer">Send Email</p>
                    </div>
                  </Link>
                </li>
               
                
               
                {/* <li id="cc" className={`flex justify-between p-2 rounded-lg my-4 ${isactive===6 ? "activ" : ""}`} onClick={()=>isopen(6)}>
                  <div className=" flex justify-center space-x-2">
                        <LogoutOutlined/> <p className=" cursor-pointer">{createloading ? (
                            <>
                            Logout
                            <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18px"
        fill="#fff"
        className="ml-2 inline animate-spin"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
          data-original="#000000"
        />
      </svg>
                            </>
                        ):"Logout"}</p>
                    </div>
                </li> */}

            </ul>
            </div>
        </div>
    </div>
  )
}

export default Doctor_Side_Bar