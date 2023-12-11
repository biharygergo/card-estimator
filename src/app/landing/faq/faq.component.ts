import { Component, OnInit, ViewEncapsulation } from '@angular/core';

type FaqRow = {
  question: string;
  answer: string;
  category: string;
};

const faqs: FaqRow[] = [
  {
    question: 'How can I start a new planning poker session?',
    answer:
      'Click on "Start planning" in the header or just <a href="/create">click here to start a new session</a>.',
    category: 'Registration',
  },
  {
    question: 'How can I add colleagues to a session?',
    category: 'Registration',
    answer:
      'Click on the "Invite others" button or just send them the URL from your browser\'s address bar. They\'ll be able to join in no time.',
  },
  {
    question: 'How many colleagues can join a planning session?',
    category: 'Registration',
    answer:
      'There are no limits to the number of voters currently, so all of your team can join.',
  },
  {
    question: 'How can I modify the cards available to vote on?',
    category: 'Gameplay',
    answer:
      'Just click the "Choose cards" button and you\'ll be able to select from a variety of card layouts available, incliding t-shirt sizing. If none suit your needs, you can even create a custom card set that fits your team.',
  },
  {
    question: 'How can I start a new round?',
    category: 'Gameplay',
    answer:
      'Click on "New round" in the top right corner of the game screen and a new round will be created. Alternatively, you can click "Manage Rounds" in the top right corner to create multiple topics in advance or modify voting order.',
  },
  {
    question: 'Can I add topics/issues in advance?',
    category: 'Gameplay',
    answer:
      'Of course! Just click "Manage Rounds" in the top right corner to create multiple topics in advance or modify voting order. If you need to revote or change the active topic, use the dropdown menu on the round/topic card in the sidebar.',
  },
  {
    question: 'How can I view the results of the vote?',
    category: 'Gameplay',
    answer:
      'Click "Reveal Votes" on the top of the game screen and all votes will become visible.',
  },
  {
    question: 'How can I view the results of previous rounds?',
    category: 'Gameplay',
    answer:
      'You can click "Manage Rounds" in the top right corner of the screen and see the overall results and statistics of each round. You can view more by clicking "Details" from the menu on the given round.',
  },
  {
    question:
      'How can I enable/disable notification sounds when a new round is started?',
    category: 'Gameplay',
    answer:
      'You can enable sounds with the "Sounds" button or disable them with the "Mute" button under the room ID on the left side.',
  },
  {
    question: 'How can I restart a previous round?',
    category: 'Gameplay',
    answer:
      'In the "Manage Rounds" section, click on the menu icon "..." on the round you\'d like to restart and click "Revote". This will clear previous votes and set the round as the currently active one.',
  },
  {
    question: 'How can I start the countdown timer?',
    category: 'Gameplay',
    answer:
      'The countdown timer is located in the right column of the app, under the main game buttons. To start a 30 second timer, just press "Start". If you wish to set a longer timer, press "+30s", which will add 30 seconds to the timer. You can pause and reset the timer once it has started. The timer will automatically start for all members of the room.',
  },
  {
    question: 'How can I contribute to the development of this app?',
    category: 'Privacy',
    answer:
      'Open the <a href="https://github.com/biharygergo/card-estimator" target="_blank">repository</a> of this project, give it a star, fork it and add a new feature!',
  },
  {
    question: 'How is my voting data stored? How long is it kept?',
    category: 'Privacy',
    answer:
      'Your voting data (name of the voter, vote, topic name) is stored in Google Firestore and is encrypted at rest. You can request deletion of your data any time via contacting the developers.',
  },
  {
    question: 'How can I view the velocity of my team?',
    category: 'Gameplay',
    answer:
      'Velocity data is shown in the sidebar and is available after results have been revealed. Velocity calculation works with numbered card sets only.',
  },
  {
    question: 'How are rooms protected? Can I set a password?',
    category: 'Privacy',
    answer:
      'By default, rooms are protected via obfuscation: room IDs are hard to guess as they are generated randomly. For increased protection, you can enable password protection on rooms you create.',
  },
  {
    question: 'How can I create a team?',
    category: 'Gameplay',
    answer:
      'A team or an "organization" allows you to add frequent members to a group and enhance the planning experience. You can create an organization from the "My Organization" menu.',
  },
];

type FaqCategory = {
  category: string;
  faqs: FaqRow[];
};

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FaqComponent implements OnInit {
  categories: FaqCategory[] = Object.values(
    faqs.reduce((acc: { [category: string]: FaqCategory }, curr: FaqRow) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { faqs: [], category: curr.category };
      }
      acc[curr.category].faqs.push(curr);
      return acc;
    }, {})
  ).sort((a, b) => a.category.localeCompare(b.category));

  constructor() {}

  ngOnInit(): void {}
}
