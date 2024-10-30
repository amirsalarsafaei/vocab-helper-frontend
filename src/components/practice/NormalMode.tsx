import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as diff from 'diff-match-patch';
import api, { ApiError }from '@/utils/api';
import {
	Box,
	TextField,
	Button,
	Typography,
	Container,
	Paper,
	CircularProgress,
	Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import NextPlan from '@mui/icons-material/NextPlan';
import { SkipNext } from '@mui/icons-material';

interface NormalPractice {
	word_id: number;
	prompt: string;
}

interface NormalPracticeResult {
	correct_word: string;
	submit_word: string;
	is_correct: boolean;
}


const NormalMode = () => {
	const [userAnswer, setUserAnswer] = useState('');
	const [showResult, setShowResult] = useState(false);
	const [result, setResult] = useState<NormalPracticeResult | null>(null);
	const [noMoreWords, setNoMoreWords] = useState(false);
	const dmp = new diff.diff_match_patch();

	const { data: wordData, isPending, isFetching, error, refetch } = useQuery<NormalPractice>({
		queryKey: ['normal-practice'],
		queryFn: async () => {
			try {
				const resp = await api.get<NormalPractice>(`/vocab/practice/normal/`);
				setNoMoreWords(false);
				return resp.data;
			} catch (error) {
				if (error instanceof ApiError && error.isNotFound()) {
					setNoMoreWords(true);
					return {
						word_id: 0,
						prompt: ""
					};
				}
				throw error;
			}
		},
		refetchOnWindowFocus: false
	});

	const { mutate, isPending: isPendingSubmit } = useMutation({
		mutationFn: async (submitSpelling: { word: string, word_id: number }) => {
			try {
				const resp = await api.post<NormalPracticeResult>(`/vocab/practice/normal/`, submitSpelling);
				const diffs = dmp.diff_main(resp.data.correct_word.toLowerCase() || "", userAnswer.toLowerCase());
				dmp.diff_cleanupSemantic(diffs);
				setResult(resp.data)
				setShowResult(true);
			} catch (error) {
				throw error;
			}
		}
	})





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
	if (noMoreWords) return <Alert severity="info">No more words to practice!</Alert>;
	if (error) return <Alert severity="error">Error loading word</Alert>;

	return (
		<Container maxWidth="lg">
			<Paper elevation={3} sx={{ p: 4, mt: 4 }}>

				<Box mb={4} justifyContent="center" display="flex" minHeight="300px" alignItems="center">
					{isFetching ? <CircularProgress /> : <TextField
						fullWidth
						value={wordData?.prompt || ''}
						multiline
						rows={13}
						variant="outlined"
						slotProps={{
							htmlInput: {
								readOnly: true,
							}
						}}
						label="Prompt"
					/>}
				</Box>

				{!showResult && (<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<TextField
						fullWidth
						value={userAnswer}
						onChange={(e) => setUserAnswer(e.target.value)}
						placeholder="Type the word that fits the empty spaces"
						variant="outlined"
						label="Your Answer"
						autoComplete="off"
						slotProps={{
							htmlInput: {
								autoCapitalize: 'off',
								autoCorrect: 'off',
								spellCheck: 'false'
							}
						}}
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

export default NormalMode;

