import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import api from '@/utils/api'
import axios from 'axios';
import {  useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';


const LoginTOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
	const navigate = useNavigate();


	const verifyTOTP = async(token: string) => {
	 try {
			const response = await api.post('/users/login/otp/', {"otp_token": token});
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				setLocalError(error.response?.data?.message || 'Otp failed');
				return
			}
			throw error;
		}
	}

	const { mutate, isPending} = useMutation({
		mutationFn: verifyTOTP,
		onSuccess: () => navigate('/'),
		onError: (error) => setLocalError(error?.message || 'unhandled error')
	})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      setLocalError('Please enter a valid 6-digit code');
      return;
    }

    setLocalError('');
		mutate(otp);
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 characters
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setOtp(value);
    setLocalError('');
  };

  return (
		<div style={
			{width: "100%", height: "100%", background: "white", display: "flex", alignItems: "center"}
		}>
			<Box
				component="form"
				onSubmit={handleSubmit}
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					width: '100%',
					maxWidth: '400px',
					margin: '0 auto',
				}}
			>
				<Typography variant="h6" color="primary" align="center">
					Enter Authentication Code
				</Typography>
				
				<TextField
					label="6-digit code"
					value={otp}
					onChange={handleOTPChange}
					error={Boolean(localError)}
					helperText={localError}
					autoComplete="one-time-code"
					slotProps={{
						htmlInput:{
							inputMode: 'numeric',
							pattern: '[0-9]*',
						}
					}}
					fullWidth
				/>

				<Button
					type="submit"
					variant="contained"
					color="primary"
					fullWidth
					disabled={otp.length !== 6 || isPending}
				>
					Verify
				</Button>
			</Box>
		</div>

  );
};

export default LoginTOTP;
