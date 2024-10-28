import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as diff from 'diff-match-patch';
import api from '@/utils/api';
import {
	Box,
	TextField,
	Button,
	Typography,
	Container,
	Paper,
	CircularProgress,
	Alert,
	IconButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';

import NextPlan from '@mui/icons-material/NextPlan';
import { SkipNext } from '@mui/icons-material';

interface SpellingPractice {
	word_id: number;
	audio_link: string;
}

interface SpellingPracticeResult {
	correct_word: string;
	submit_word: string;
	is_correct: boolean;
}


const SpellingMode = () => {
	const [userAnswer, setUserAnswer] = useState('');
	const [showResult, setShowResult] = useState(false);
	const [result, setResult] = useState<SpellingPracticeResult | null>(null);
	const [playCount, setPlayCount] = useState(0);
	const [isAudioLoading, setIsAudioLoading] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const dmp = new diff.diff_match_patch();

	const { data: wordData, isPending, error, refetch, dataUpdatedAt } = useQuery<SpellingPractice>({
		queryKey: ['spelling-practice'],
		queryFn: async () => {
			try {
				const resp = await api.get<SpellingPractice>(`/vocab/practice/spelling/`);
				return resp.data;
			} catch (error) {
				throw error;
			}
		},
		refetchOnWindowFocus: false,
	});

	const { mutate, isPending: isPendingSubmit } = useMutation({
		mutationFn: async (submitSpelling: { word: string, word_id: number }) => {
			try {
				const resp = await api.post<SpellingPracticeResult>(`/vocab/practice/spelling/`, submitSpelling);
				const diffs = dmp.diff_main(resp.data.correct_word.toLowerCase() || "", userAnswer.toLowerCase());
				dmp.diff_cleanupSemantic(diffs);
				setResult(resp.data)
				setShowResult(true);
			} catch (error) {
				throw error;
			}
		}
	})


	useEffect(() => {
		if (wordData?.audio_link && audioRef.current) {
			setIsAudioLoading(true);
			audioRef.current.src = wordData.audio_link;
			audioRef.current.load();

			const handleCanPlay = () => {
				setIsAudioLoading(false);
				if (playCount === 0) {
					audioRef.current?.play().catch(console.error);
					setPlayCount(1);
				}
			};

			const handleEnded = () => {
				if (playCount < 3) {
					setPlayCount(prev => prev + 1);
				}
			};

			audioRef.current.addEventListener('canplaythrough', handleCanPlay);
			audioRef.current.addEventListener('ended', handleEnded);

			return () => {
				if (audioRef.current) {
					audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
					audioRef.current.removeEventListener('ended', handleEnded);
				}
			};
		}
	}, [wordData, dataUpdatedAt]);



	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!wordData) return;


		mutate({ word: userAnswer, word_id: wordData.word_id })

	};

	const renderDiff = () => {
		if (!wordData) return null;

		const diffs = dmp.diff_main(result?.correct_word?.toLowerCase() || "", userAnswer.toLowerCase());
		dmp.diff_cleanupSemantic(diffs);

		return diffs.map((diff, index) => {
			const [type, text] = diff;
			const style = type === -1 ? { backgroundColor: '#ffcdd2' } :
				type === 1 ? { backgroundColor: '#c8e6c9' } : {};
			return <span key={index} style={style}>{text}</span>;
		});
	};

	const handleNext = () => {
		setUserAnswer("");
		setShowResult(false);
		setPlayCount(0);
		setIsAudioLoading(true);
		audioRef?.current?.pause();

		refetch();
	}

	useEffect(() => {
		if (!showResult) {
			return;
		}

		const handleKeyPress = (event: KeyboardEvent) => {
			if (showResult && event.key === 'Enter') {
				handleNext();
			}
		};

		document.addEventListener('keypress', handleKeyPress);
		return () => {
			document.removeEventListener('keypress', handleKeyPress);
		};
	}, [showResult]);

	if (isPending) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
	if (error) return <Alert severity="error">Error loading word</Alert>;

	return (
		<Container maxWidth="sm">
			<Paper elevation={3} sx={{ p: 4, mt: 4 }}>
				<audio ref={audioRef} src={wordData?.audio_link} />

				<Box mb={4}>

					<IconButton
						onClick={() => {
							audioRef?.current?.play();
							setPlayCount(prev => prev + 1);
						}}
						disabled={isAudioLoading}
						color="primary"
						size="large"
					>
						<PlayArrowIcon />
					</IconButton>
				</Box>

				{!showResult && (<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<TextField
						fullWidth
						value={userAnswer}
						onChange={(e) => setUserAnswer(e.target.value)}
						placeholder="Type what you hear..."
						variant="outlined"
						label="Your Answer"
						autoComplete="off"
						slotProps={{htmlInput:{
							autoCapitalize: 'off',
							autoCorrect: 'off',
							spellCheck: 'false'
						}}}
					/>
					<Button
						type="submit"
						variant="contained"
						color="primary"
						endIcon={<SendIcon />}
						disabled={isPendingSubmit}
					>
						Submit
					</Button>
					<Button
						type="button"
						variant="contained"
						color="primary"
						endIcon={<SkipNext />}
						disabled={isPending}
						onClick={handleNext}
					>
						Skip
					</Button>

				</Box>)}

				{showResult && (
					<Box mt={10}>
						<Typography variant="h6" gutterBottom>Results</Typography>
						<Typography variant="body1" gutterBottom>
							Correct word: {result?.correct_word || ""}
						</Typography>
						<Typography variant="body1" gutterBottom>
							Your answer: {userAnswer}
						</Typography>
						<Typography variant='h5'>
							Difference:
						</Typography>
						<Typography variant="h3" component="div">
							{renderDiff()}
						</Typography>
						<Button
							type="button"
							variant="contained"
							color="primary"
							endIcon={<NextPlan />}
							onClick={handleNext}
						>
							Next
						</Button>
					</Box>
				)}
			</Paper>
		</Container>
	);
};

export default SpellingMode;

