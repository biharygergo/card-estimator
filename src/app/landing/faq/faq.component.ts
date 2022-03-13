import { Component, OnInit } from '@angular/core';

type FaqRow = {
  question: string;
  answer: string;
};

const faqs: FaqRow[] = [
  {
    question: 'How can I start a new planning poker session?',
    answer:
      'Click on "Start planning" in the header or just click <a href="/join">here</a> to start.',
  },
  {
    question: 'How can I add colleagues to a session?',
    answer:
      'Click on the "Invite others" button or just send them the URL from your browser\'s address bar. They\'ll be able to join in no time.',
  },
  {
    question: 'How many colleagues can join a planning session?',
    answer:
      'There are no limits to the number of voters currently, so all of your team can join.',
  },
  {
    question: 'How can I modify the cards available to vote on?',
    answer:
      'Just click the "Units" button and you\'ll be able to select from a variety of card layouts available, incliding t-shirt sizing.',
  },
  {
    question: 'How can I start a new round?',
    answer:
      'Click on "New round" in the top right corner of the game screen and a new round will be created.',
  },
  {
    question: 'How can I view the results of the vote?',
    answer:
      'Click "Show results" on the top of the game screen and all votes will become visible.',
  },
  {
    question:
      'How can I enable/disable notification sounds when a new round is started?',
    answer:
      'You can enable sounds with the "Sounds" button or disable them with the "Mute" button under the room ID on the left side.',
  },
  {
    question: 'How can I restart a previous round?',
    answer:
      'In the "History" section, click on the issue you\'d like to restart and click "Revote". This will clear previous votes and set the issue as the currently active one.',
  },
  {
    question: 'How can I contribute to the development of this app?',
    answer:
      'Open the <a href="https://github.com/biharygergo/card-estimator" target="_blank">repository</a> of this project, give it a star, fork it and add a new feature!',
  },
  {
    question: 'How is my voting data stored? How long is it kept?',
    answer:
      'Your voting data (name of the voter, vote, topic name) is stored for 14 days and deleted automatically afterwards. While the data is held, it is accessible via the room ID that is generated when you create a new room.',
  },
];
@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent implements OnInit {
  faqs = faqs;
  constructor() {}

  ngOnInit(): void {}
}
