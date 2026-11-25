import { useState, useEffect } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CreateContentModal } from '../components/CreateContentModal'
import { PlusIcon } from '../icons/PlusIcon'
import { ShareIcon } from '../icons/ShareIcon'
import { UserIcon } from '../icons/UserIcon'
import { SideBar } from '../components/Sidebar'
import { ProfileModal } from '../components/ProfileModal'
import { useContent } from '../hooks/useContent'
import { BACKEND_URL } from '../config'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<{ username?: string; contentCount?: number } | null>(null);
  const contents = useContent();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    axios.get(`${BACKEND_URL}/api/v1/me`, {
      headers: {
        Authorization: token
      }
    })
    .then((res) => {
      setUser(res.data);
    })
    .catch(() => {
      localStorage.removeItem("token");
      navigate("/signin");
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return <>
  <div>
    <SideBar 
      user={user} 
      onOpenProfile={() => setProfileOpen(true)} 
      onLogout={handleLogout} 
    />
    <ProfileModal 
      open={profileOpen} 
      onClose={() => setProfileOpen(false)} 
      user={user} 
      onLogout={handleLogout} 
    />
    <div className='p-6 ml-72 min-h-screen bg-gray-50'>
      <CreateContentModal open={modalOpen} onClose={() => {
        setModalOpen(false);
      }}/>
      <div className='flex justify-between items-center pb-6 border-b border-gray-200 mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>
            Welcome back{user?.username ? `, ${user.username}` : ''}!
          </h1>
        </div>
        <div className='flex items-center gap-3'>
          <Button onClick={() => {
            setModalOpen(true)
          }} variant='primary' text='Add Content' startIcon={<PlusIcon/>}></Button>
          <Button variant='secondary' text='Share Brain' startIcon={<ShareIcon/>}></Button>
        </div>
      </div>

      <div className='flex flex-wrap gap-4'>
        {contents.map(({type, link, title}, index) => 
          <Card
            key={index}
            type={type}
            link={link}
            title={title}/>
        )}
      </div>
    </div>
  </div>
  </>
}


