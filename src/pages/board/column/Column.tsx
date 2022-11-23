import React, { useEffect, useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ColumnType, TaskParsedType } from 'store/boardSlice';
import styles from './column.module.scss';
import { useAppSelector, useAppDispatch } from 'store/hooks';
import Icon from 'components/Icon/Icon';
import {
  BtnColor,
  ModalAction,
  setModalColumnId,
  setModalOpen,
  setTaskId,
  setTaskModalOpen,
} from 'store/modalSlice';
import { useTranslation } from 'react-i18next';
import { thunkGetAllTasks } from 'store/middleware/tasks';
import { thunkUpdateTitleColumn } from 'store/middleware/columns';
import { Draggable, Droppable } from 'react-beautiful-dnd';

type Props = {
  columnData: ColumnType;
  index: number;
};

interface IFormInputs {
  input: string;
}

const Column = (props: Props) => {
  const { tasks } = useAppSelector((state) => state.board);
  const column = props.columnData;
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [isEditable, setIsEditable] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IFormInputs>({
    mode: 'onChange',
  });

  const formEdit = useRef<HTMLFormElement>(null);
  const columnTitle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(thunkGetAllTasks({ boardId: column.boardId, columnId: column._id }));
    console.log(column.order, column._id);
  }, [dispatch, column.boardId, column._id, column.order]);

  const onSubmitEdit: SubmitHandler<IFormInputs> = (data) => {
    dispatch(
      thunkUpdateTitleColumn({
        boardId: column.boardId,
        columnId: column._id,
        order: column.order,
        title: data.input,
      })
    ).then(() => setIsEditable(false));
  };

  /* useEffect(() => {
    const onClick = (e: MouseEvent) => {
      console.log(formEdit.current && formEdit.current.contains(e.target as HTMLElement));
      if (
        !isEditable ||
        (formEdit.current && formEdit.current.contains(e.target as HTMLElement)) ||
        (columnTitle.current && columnTitle.current.contains(e.target as HTMLElement))
      ) {
        return;
      }
      console.log('win');
      handleSubmit(onSubmitEdit)();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [isEditable, reset, handleSubmit]);*/

  const deleteColumn = (title: string) => {
    dispatch(setModalColumnId(column._id));
    dispatch(
      setModalOpen({
        message: `${t('MODAL.DELETE_MSG')} ${title}?`,
        color: BtnColor.RED,
        btnText: `${t('MODAL.DELETE')}`,
        action: ModalAction.COLUMN_DELETE,
      })
    );
  };

  const createTask = () => {
    dispatch(setModalColumnId(column._id));
    dispatch(
      setModalOpen({
        title: `${t('BOARD.CREATE_TASK_TITLE')}`,
        inputTitle: `${t('MODAL.TITLE')}`,
        inputDescr: `${t('MODAL.DESCRIPTION')}`,
        color: BtnColor.BLUE,
        btnText: `${t('MODAL.CREATE')}`,
        action: ModalAction.TASK_CREATE,
      })
    );
  };

  const openTaskModal = (task: TaskParsedType, columnId: string) => {
    dispatch(setTaskId(task));
    dispatch(setModalColumnId(columnId));
    dispatch(setTaskModalOpen());
  };

  return (
    <Draggable draggableId={column._id} index={props.index}>
      {(provided) => (
        <li
          data-key={column._id}
          className={styles.columnItem}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {isEditable ? (
            <form ref={formEdit} className={styles.form} onSubmit={handleSubmit(onSubmitEdit)}>
              <input
                autoFocus
                type="text"
                {...register('input', {
                  value: column.title,
                  required: 'REQ_ER',
                  maxLength: { value: 25, message: 'MAX_ER' },
                })}
                className={`${styles.input} ${errors.input ? styles.error : ''}`}
              />
              <button
                className={`${styles.buttonEdit} ${styles.submit}`}
                type="submit"
                disabled={!(Object.keys(errors).length === 0)}
              >
                <Icon color="#0047FF" size={100} icon="done" className={styles.icon} />
              </button>
              <button
                className={styles.buttonEdit}
                onClick={() => {
                  reset();
                  setIsEditable(false);
                }}
              >
                <Icon color="#CC0707" size={100} icon="cancel" className={styles.icon} />
              </button>
              <span className={styles.formError}>
                {errors.input && t(`COLUMN.${errors.input.message}`)}
              </span>
            </form>
          ) : (
            <div ref={columnTitle} className={styles.columnTitle} {...provided.dragHandleProps}>
              <div className={styles.titleName} onClick={() => setIsEditable(true)}>
                {column.title}
              </div>
              <button className={styles.button} onClick={() => deleteColumn(column.title)}>
                <Icon color="#CC0707" size={100} icon="trash" className={styles.icon} />
              </button>
            </div>
          )}
          <hr className={styles.columnLine}></hr>
          <Droppable droppableId={column._id} direction={'vertical'} mode={'standard'} type="TASK">
            {(providedColumn) => (
              <ul
                className={styles.tasksList}
                {...providedColumn.droppableProps}
                ref={providedColumn.innerRef}
              >
                {tasks[column._id] &&
                  tasks[column._id].map((task, i) => (
                    <Draggable draggableId={task._id} index={i} key={task._id}>
                      {(providedTask) => (
                        <li
                          className={styles.taskItem}
                          onClick={() => openTaskModal(task, column._id)}
                          ref={providedTask.innerRef}
                          {...providedTask.draggableProps}
                        >
                          <div className={styles.taskTitle} {...providedTask.dragHandleProps}>
                            {task.title}
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                {providedColumn.placeholder}
              </ul>
            )}
          </Droppable>
          <div className={`${styles.taskButton} ${styles.addButton}`} onClick={createTask}>
            {t('BOARD.CREATE_TASK_BUTTON')}
            <Icon color="#0047FF" size={100} icon="add" className={styles.icon} />
          </div>
        </li>
      )}
    </Draggable>
  );
};

export default Column;
