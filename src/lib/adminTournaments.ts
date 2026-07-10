export type AdminTournament = {
	id: string;
	name: string;
	venue: string;
	date: string;
	status: "setup" | "registration" | "live" | "completed";
	description: string;
	settings: {
		maxPlayers: number;
		waitlistLimit: number;
		courts: number;
		matchDuration: number;
		teamSize: string;
		format: string;
		status: "setup" | "registration" | "live" | "completed";
		categories: string[];
	};
};
