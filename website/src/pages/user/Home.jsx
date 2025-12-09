import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapFetch } from '../../services/bootstrapService';
import { setBootstrapData } from '../../redux/slices/bootstrapSlice';
import ListingsMapPage from './ListingsMapPage';
const Home = () => {
  const navigate = useNavigate();
  

  return (
    <div className="h-full relative">
<ListingsMapPage/>
    </div>
  );
};

export default Home;
