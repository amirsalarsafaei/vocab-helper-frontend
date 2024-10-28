import React, { useState } from "react";
import "./Words.scss";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import axios from "axios";

interface ApiWord {
	id?: number;
	word: string;
	is_spelling: boolean;
}

interface Word {
	id?: number;
	word: string;
	isSpelling: boolean;
}



interface WordFormProps {
	onAddWord: (word: Word) => void;
	disabled: boolean;
}

const WordForm: React.FC<WordFormProps> = ({
	disabled,
	onAddWord
}) => {
	const [newWord, setNewWord] = useState("");
	const [isSpelling, setIsSpelling] = useState(true);

	const handleAddWord = ({ }) => {
		if (!newWord.trim()) return;

		const word: Word = {
			word: newWord.trim(),
			isSpelling: isSpelling
		};

		onAddWord(word)
	};
	return (
		<div className="words-form">
			<input
				type="text"
				value={newWord}
				onChange={(e) => setNewWord(e.target.value)}
				placeholder="Enter a word"
			/>
			<label>
				<input
					type="checkbox"
					checked={isSpelling}
					onChange={(e) => setIsSpelling(e.target.checked)}
				/>
				Spelling only
			</label>
			<button disabled={disabled} onClick={handleAddWord}>Add Word</button>
		</div>
	);
};

const Words: React.FC = () => {

	const getWords = async (): Promise<Word[]> => {
		const resp = await api.get<ApiWord[]>('/vocab/words/');
		return resp.data.map((item: ApiWord) => ({
			id: item.id,
			word: item.word,
			isSpelling: item.is_spelling
		}));
	};

	const { data, refetch } = useQuery({
		queryKey: ['words'],
		queryFn: getWords,
	});


	const addWord = async ({ isSpelling: is_spelling, word: word }: Word) => {
		try {
			const resp = await api.post('/vocab/words/', {
				word, is_spelling
			})
			return resp.data
		} catch (error) {
			if (axios.isAxiosError(error)) {
				return
			}
			throw error;
		}
	}

	const { isPending: isPendingNewWord, mutate: mutateNewWord } = useMutation({
		mutationFn: addWord,
		onSuccess: () => {
			refetch();
		}
	})
	const deleteWord = async (id: number) => {
		try {
			await api.delete(`/vocab/words/${id}/`);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				return;
			}
			throw error;
		}
	};

	const { mutate: mutateDeleteWord } = useMutation({
		mutationFn: deleteWord,
		onSuccess: () => {
			refetch();
		}
	});

	const handleRemoveWord = (id?: number) => {
		if(!id) {
			return;
		}
		mutateDeleteWord(id);
	};

	return (
		<div className="words-container">
			<WordForm
				onAddWord={mutateNewWord}
				disabled={isPendingNewWord}
			/>
			<div className="words-list">
				{data?.map((word) => (
					<div key={word.id} className="word-item">
						<span className="word-text">{word.word}</span>
						<span className="word-type">
							{word.isSpelling ? "Spelling Only" : "Spelling & Definition"}
						</span>
						<button
							onClick={() => handleRemoveWord(word.id)}
							className="remove-button"
						>
							Remove
						</button>
					</div>
				))}
			</div>
		</div>
	);
};

export default Words;
